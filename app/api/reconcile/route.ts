// app/api/reconcile/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    // Phase 1: Parse the user parameters coming from your front-end form
    const {
      sugEventId: rawSug,
      sourceSheetId: rawSource,
      destSheetId: rawDest,
    } = await request.json();

    // 1. Helper function to extract Google Spreadsheet ID from a full URL
    const extractSheetId = (input: string) => {
      const clean = input ? input.trim() : "";
      if (!clean.includes("docs.google.com")) return clean;

      // We search for the pattern and use [1] to pull just the captured ID
      const match = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match && match[1] ? match[1] : clean;
    };

    // 2. Helper function to extract SignUpGenius ID from a full URL
    const extractSugId = (input: string) => {
      const clean = input.trim();
      if (!clean.includes("signupgenius.com")) return clean; // If it's already just the ID, return it

      // Looks for an isolated 8-digit or 9-digit number string surrounded by dashes or slashes
      const match =
        clean.match(/[-/]([0-9]{7,10})[-/#?]/) || clean.match(/id=([0-9]+)/);
      return match ? match[1] : clean;
    };

    // Extract the clean operational keys
    const sugEventId = extractSugId(rawSug);
    const sourceSheetId = extractSheetId(rawSource);
    const destSheetId = extractSheetId(rawDest);

    // Log the parsed IDs to the terminal for debugging visibility
    console.log("--- Extracted Parameter Keys ---");
    console.log("SignUpGenius Event ID:", sugEventId);
    console.log("Source Sheet ID:", sourceSheetId);
    console.log("Destination Sheet ID:", destSheetId);

    if (!sugEventId || !sourceSheetId || !destSheetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract valid IDs from one or more inputs.",
        },
        { status: 400 },
      );
    }

    // Phase 2: Securely shake hands with the Google Sheets API using your Robot identity
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!email || !rawKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "System Error: Google service account credentials are missing from .env.local file.",
        },
        { status: 500 },
      );
    }

    const privateKey = rawKey.replace(/\\n/g, "\n").replace(/^"|"$/g, "");

    // Clean up any formatting quirks or escaped quotes automatically
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"], //
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Phase 3: Connect to SignUpGenius to fetch the expected event master roster
    // (Note: Replace this mockup fetch with your specific validated SignUpGenius endpoint format)

    const sugApiKey = process.env.SIGNUPGENIUS_API_KEY;

    const sugUrl = `https://api.signupgenius.com/v2/k/signups/report/filled/${sugEventId}/?user_key=${sugApiKey}`;

    const sugResponse = await fetch(sugUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!sugResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch the roster from SignUpGenius.",
        },
        { status: 400 },
      );
    }

    const sugData = await sugResponse.json();
    const expectedSlots = sugData.data?.signup || []; // Expected shape: Array of { email, firstname, lastname }

    // Phase 4: Read your live check-in logs from your active web-app sheet
    const sourceData = await sheets.spreadsheets.values.get({
      spreadsheetId: sourceSheetId,
      range: "Sheet1!A2:E", // Fetches historical check-in rows
    });
    const logRows = sourceData.data.values || [];

    // Create a Set of lowercase emails tracking parents who *actually* dropped an "IN" record
    const checkedInEmails = new Set(
      logRows
        .filter((row) => row[4] && row[4]?.toLowerCase().trim() === "in") // Assuming Column E (Index 4) tracks action type "IN"
        .map((row) => { 
          const email = row[1]?.toLowerCase().trim() || "";
          const role = row[3]?.toLowerCase().trim() || ""; // Assuming Column D (Index 3) holds the Slot Name/Role
          return `${email}-${role}`;
        })
        .filter(Boolean) // Safely discards empty rows
    );

    // Phase 5: Run the delta comparison to extract our No-Shows

    const noShows = expectedSlots
      .filter((volunteer: any) => {
        const cleanEmail = volunteer.email?.toLowerCase().trim() || "";
        const cleanRole = volunteer.item?.toLowerCase().trim() || "general volunteer slot";

        // Match against the combined key
        const shiftKey = `${cleanEmail}-${cleanRole}`;
        return !checkedInEmails.has(shiftKey);
      })
      .map((v: any) => ({
        email: v.email || "N/A",
        firstname: v.firstname || "",
        lastname: v.lastname || "",
        role: v.item || "General Volunteer Slot", // Adding the role to the front-end packet 🚀
      }));

    // Phase 6: If missing parents are found, write the list into your destination spreadsheet
    if (noShows.length > 0) {
      // 1. Check if the destination sheet already has content
      const destCheck = await sheets.spreadsheets.values.get({
        spreadsheetId: destSheetId,
        range: "Sheet1!A1:C1", // Look at just the very first row
      });
      const hasHeaders =
        destCheck.data.values && destCheck.data.values.length > 0;

      // 2. If it's a brand new or empty sheet, prepend our clean header row
      if (!hasHeaders) {
        console.log("Destination sheet is empty. Writing headers first...");
        await sheets.spreadsheets.values.append({
          spreadsheetId: destSheetId,
          range: "Sheet1!A1",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Email", "Name", "Role"]], // Your clean headers
          },
        });
      }

      // 3. Map out our parent volunteer data rows
      const outputRows = noShows.map((v: any) => [
        v.email || "N/A", // Column A: Email
        `${v.firstname || ""} ${v.lastname || ""}`.trim(), // Column B: Name
        v.role || "General Volunteer Slot", // Column C: Role
      ]);

      console.log(
        `Writing ${outputRows.length} no-show rows to destination sheet...`,
      );

      // 4. Append the no-show roster right under the headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: destSheetId,
        range: "Sheet1!A2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: outputRows },
      });
    }

    // Return the successful list back up to your visual UI screen
    return NextResponse.json({ success: true, noShows });
  } catch (error: any) {
    console.error("Server Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
