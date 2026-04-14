const API_BASE_URL = 'http://localhost:5000/api';
const APP_USERNAME = 'PUNNAM444';
const APP_PASSWORD = 'PUNNAM444';

function syncSheetRowsToRentApp() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    SpreadsheetApp.getUi().alert('No data rows found.');
    return;
  }

  const headers = values[0].map((h) => String(h || '').trim());
  const rows = values.slice(1);

  const statusCol = ensureColumn(sheet, headers, 'syncStatus');
  const messageCol = ensureColumn(sheet, headers, 'syncMessage');

  const payloadRows = [];
  const sheetRowIndexes = [];

  rows.forEach((rowValues, idx) => {
    const rowObject = rowToObject(headers, rowValues);
    const action = String(rowObject.action || '').trim();
    if (!action) {
      return;
    }

    payloadRows.push(cleanRow(rowObject));
    sheetRowIndexes.push(idx + 2);
  });

  if (!payloadRows.length) {
    SpreadsheetApp.getUi().alert('No actionable rows. Add action values first.');
    return;
  }

  const token = loginAndGetToken();
  const result = UrlFetchApp.fetch(`${API_BASE_URL}/sync/sheet-actions`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: JSON.stringify({ rows: payloadRows }),
    muteHttpExceptions: true
  });

  const bodyText = result.getContentText();
  const statusCode = result.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Sync failed (${statusCode}): ${bodyText}`);
  }

  const parsed = JSON.parse(bodyText);
  (parsed.results || []).forEach((item, i) => {
    const sheetRow = sheetRowIndexes[i];
    if (!sheetRow) {
      return;
    }

    sheet.getRange(sheetRow, statusCol).setValue(item.ok ? 'SUCCESS' : 'FAILED');
    sheet.getRange(sheetRow, messageCol).setValue(item.message || '');
  });

  const summary = parsed.summary || {};
  SpreadsheetApp.getUi().alert(
    `Sync complete. Total: ${summary.total || 0}, Succeeded: ${summary.succeeded || 0}, Failed: ${summary.failed || 0}`
  );
}

function loginAndGetToken() {
  const response = UrlFetchApp.fetch(`${API_BASE_URL}/auth/login`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      username: APP_USERNAME,
      password: APP_PASSWORD
    }),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const text = response.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error(`Login failed (${status}): ${text}`);
  }

  const payload = JSON.parse(text);
  if (!payload.token) {
    throw new Error('Login response missing token.');
  }

  return payload.token;
}

function rowToObject(headers, rowValues) {
  const output = {};
  headers.forEach((header, index) => {
    output[header] = rowValues[index];
  });
  return output;
}

function cleanRow(row) {
  const cleaned = {};
  Object.keys(row).forEach((key) => {
    if (!key) {
      return;
    }

    const value = row[key];
    if (value === '' || value == null) {
      return;
    }

    cleaned[key] = value;
  });
  return cleaned;
}

function ensureColumn(sheet, headers, columnName) {
  let index = headers.indexOf(columnName);
  if (index === -1) {
    index = headers.length;
    sheet.getRange(1, index + 1).setValue(columnName);
    headers.push(columnName);
  }
  return index + 1;
}
