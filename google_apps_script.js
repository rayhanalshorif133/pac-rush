/**
 * Google Apps Script for "Pac RUsh" Spreadsheet
 * Sheet URL: https://docs.google.com/spreadsheets/d/1syWTsKaf2nqY_Nru9m2vZrwjh-QqLjWYiaUguFGMIeQ/edit
 *
 * HOW TO SETUP (কীভাবে সেটআপ করবেন):
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1syWTsKaf2nqY_Nru9m2vZrwjh-QqLjWYiaUguFGMIeQ/edit
 * 2. Click "Extensions" (এক্সটেনশন) -> "Apps Script"
 * 3. Delete any code in Code.gs and paste this ENTIRE code.
 * 4. Click "Deploy" (ডিপ্লয়) -> "New deployment" (নতুন ডিপ্লয়মেন্ট)
 * 5. Select type: "Web app" (ওয়েব অ্যাপ)
 * 6. Set Description: "Pac Rush Logger"
 * 7. Set "Execute as": "Me" (আমার হিসেবে)
 * 8. Set "Who has access": "Anyone" (যে কেউ / Anyone with the link) -> [CRITICAL STEP!]
 * 9. Click "Deploy" and authorize access.
 * 10. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec)
 * 11. Paste that URL into google_sheet_config.json (or in the game-over screen)!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // If sheet is brand new / empty, create styled header row
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Time (সময়)", "Click (ক্লিক)", "Score (পয়েন্ট)", "Date & Time (তারিখ ও সময়)"]);
      var headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#00ffcc");
      headerRange.setFontColor("#000000");
    }

    // Append new game run row
    sheet.appendRow([
      data.time || "",
      data.click || 0,
      data.score || 0,
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row added successfully to Pac RUsh Sheet!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Pac Rush Google Sheet Webhook is active and running!");
}

