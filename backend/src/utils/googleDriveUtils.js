const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Initialize Google Drive client
const getAuthClient = () => {
  const keyPath = path.join(__dirname, "../../google-key.json");
  
  if (!fs.existsSync(keyPath)) {
    throw new Error("Google Drive credentials not found. Please add google-key.json to the backend directory.");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  });

  return google.drive({ version: "v3", auth });
};

// Upload file to Google Drive
const uploadToDrive = async (fileName, filePath, mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") => {
  try {
    const drive = getAuthClient();
    
    const fileMetadata = {
      name: fileName,
      mimeType: mimeType
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink"
    });

    // Clean up temporary file
    fs.unlinkSync(filePath);

    return {
      fileId: response.data.id,
      fileLink: response.data.webViewLink
    };
  } catch (err) {
    console.error("Google Drive upload error:", err.message);
    throw new Error(`Failed to upload to Google Drive: ${err.message}`);
  }
};

module.exports = { getAuthClient, uploadToDrive };
