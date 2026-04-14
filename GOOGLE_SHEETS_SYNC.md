# Google Sheets Sync (Gemini + Rent Management)

This project now supports bulk action sync from Google Sheets.

## New API Endpoint

- `POST /api/sync/sheet-actions`
- Auth required: `Authorization: Bearer <token>`
- Body:

```json
{
  "rows": [
    {
      "action": "MOVE_IN",
      "flatNumber": "303",
      "name": "Ravi",
      "phone": "9999999999",
      "agreedRent": 18000,
      "agreedDeposit": 30000,
      "leaseStart": "2026-04-01"
    }
  ]
}
```

## Supported Actions

- `MOVE_IN`
  - Required: `flatNumber`, `name`, `phone`, `agreedRent`, `leaseStart`
  - Optional: `agreedDeposit`, `leaseEnd`, `baseRent`, `month`
- `VACATE`
  - Required: `flatNumber` (or `tenantId`)
  - Optional: `vacatingDate` (`YYYY-MM-DD`)
- `MARK_PAID`
  - Required: `flatNumber`
  - Optional: `month` (`YYYY-MM`), `paidDate` (`YYYY-MM-DD`)
- `MARK_PENDING`
  - Required: `flatNumber`
  - Optional: `month` (`YYYY-MM`)
- `UPDATE_RENT`
  - Required: `flatNumber`, `agreedRent`
  - Optional: `month` (`YYYY-MM`) to set threshold for future payments
- `ADD_DEPOSIT`
  - Required: `flatNumber`, `amount`
  - Optional: `date` (`YYYY-MM-DD`), `note`
- `DELETE_DEPOSIT`
  - Required: `flatNumber`, `depositId`

## Response Format

```json
{
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1
  },
  "results": [
    {
      "index": 0,
      "action": "MOVE_IN",
      "ok": true,
      "message": "Tenant moved in",
      "tenantId": "..."
    },
    {
      "index": 1,
      "action": "MARK_PAID",
      "ok": false,
      "message": "Active tenant not found for flat"
    }
  ]
}
```

## Suggested Sheet Columns

Use header row with these names (case-sensitive):

- `action`
- `flatNumber`
- `name`
- `phone`
- `agreedRent`
- `agreedDeposit`
- `leaseStart`
- `leaseEnd`
- `baseRent`
- `month`
- `paidDate`
- `vacatingDate`
- `amount`
- `date`
- `note`
- `depositId`
- `syncStatus`
- `syncMessage`

## Gemini + PDF Workflow

Best workflow:

1. Use Gemini to extract PDF rows into the sheet.
2. Review values (especially dates/amounts/IDs).
3. Run the Apps Script sync function.
4. Check `syncStatus` and `syncMessage` columns.

PDF extraction can misread numbers and dates. Always review before syncing.
