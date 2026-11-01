/**
 * RowPulser Sally log receiver — deploy as Google Apps Script Web App.
 * Script properties: SALLY_LOG_SECRET (random long secret).
 * Execute as: Me. Access: Anyone (authentication is checked by the secret).
 * Keep the deployed URL and secret in Cloudflare Pages environment secrets.
 * No full transcripts or pasted event logs are stored.
 */
const COLUMNS = ['timestamp','conversationId','category','platform','phoneModel','hrDevice','appVersion','summary','diagnosis','compatibility','escalated','email','responded','resolution','inputTokens','outputTokens','estimatedCostUSD','consentTimestamp','notes'];
function doPost(e) {
  try {
    const data=JSON.parse(e.postData.contents);
    const secret=PropertiesService.getScriptProperties().getProperty('SALLY_LOG_SECRET');
    if (!secret || data.secret!==secret) return ContentService.createTextOutput('Unauthorized');
    const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sally Conversations');
    if (!sheet) return ContentService.createTextOutput('Sheet missing');
    const row=COLUMNS.map(k=>String(data[k]??'').slice(0,1500));
    // Prevent formula injection from user-generated text.
    sheet.appendRow(row.map(v=>/^[=+@-]/.test(v)?("'"+v):v));
    return ContentService.createTextOutput('OK');
  } catch (err) {return ContentService.createTextOutput('Error')}
}