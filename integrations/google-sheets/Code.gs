/**
 * Elanmist checkout → Google Sheets
 *
 * Receives checkout events from the website and writes one row per order to the
 * "Orders" tab, updating that row as the payment status changes.
 *
 * Setup: see integrations/google-sheets/README.md
 *   Extensions → Apps Script → paste this file → Project Settings → Script
 *   properties → add SHARED_SECRET → Deploy → New deployment → Web app
 *   (Execute as: Me, Who has access: Anyone) → copy the /exec URL.
 */

var SHEET_NAME = 'Orders';

var HEADERS = [
  'Created', 'Updated', 'Order No', 'Status',
  'Name', 'Email', 'Phone',
  'Address line 1', 'Address line 2', 'City', 'State', 'Pincode',
  'Items', 'Subtotal (₹)', 'Delivery (₹)', 'Total (₹)',
  'Razorpay Order ID', 'Payment ID', 'Payment method', 'Notes',
];

// Map from the JSON keys the website sends to the column headers above.
var FIELD_TO_HEADER = {
  status: 'Status',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address1: 'Address line 1',
  address2: 'Address line 2',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  items: 'Items',
  subtotal: 'Subtotal (₹)',
  shipping: 'Delivery (₹)',
  total: 'Total (₹)',
  razorpayOrderId: 'Razorpay Order ID',
  paymentId: 'Payment ID',
  method: 'Payment method',
  notes: 'Notes',
};

// A "Paid" row must never be downgraded by a late or retried event.
var FINAL_STATUSES = ['Paid', 'Refunded'];

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'invalid json' });
  }

  var secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!secret || body.secret !== secret) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  if (!body.orderNo) {
    return json_({ ok: false, error: 'missing orderNo' });
  }

  // Serialise writes so two events for the same order can't create duplicate rows.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_();
    upsert_(sheet, String(body.orderNo), body.data || {});
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsert_(sheet, orderNo, data) {
  var now = new Date();
  var col = {};
  HEADERS.forEach(function (h, i) { col[h] = i; });

  var lastRow = sheet.getLastRow();
  var rowIndex = -1;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, col['Order No'] + 1, lastRow - 1, 1).getValues();
    for (var i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i][0]) === orderNo) { rowIndex = i + 2; break; }
    }
  }

  var row = rowIndex > 0
    ? sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]
    : HEADERS.map(function () { return ''; });

  var currentStatus = row[col['Status']];
  var lockedStatus = FINAL_STATUSES.indexOf(currentStatus) !== -1;

  Object.keys(FIELD_TO_HEADER).forEach(function (key) {
    if (data[key] === undefined || data[key] === null || data[key] === '') return;
    if (key === 'status' && lockedStatus && data.status !== 'Refunded') return;
    row[col[FIELD_TO_HEADER[key]]] = safe_(data[key]);
  });

  if (rowIndex < 0) row[col['Created']] = now;
  row[col['Updated']] = now;
  row[col['Order No']] = orderNo;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

// Stops values like "=IMPORTXML(...)" typed into the checkout form from being
// run as spreadsheet formulas (CSV/formula injection).
function safe_(value) {
  if (typeof value === 'number') return value;
  var s = String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
