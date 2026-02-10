# Investigation Report: Event API

**Ticket:** 049-fix-events
**Date:** 2026-02-10
**Status:** Investigation Complete

---

## 1. Reproduction Steps

### Local API Testing

```bash
# 1. Start the API server
cd "C:\Users\Administrator\Documents\GitHub\Uma-Event-Helper-Web"
python api/[...path].py

# 2. Test /events endpoint
curl -X GET http://localhost:3000/events

# Expected: {"events": ["Event1", "Event2", ...]} with 363 events

# 3. Test /event_by_name endpoint with fuzzy search
curl -X GET "http://localhost:3000/event_by_name?event_name=Overthrow"

# Expected: {"match": {...}, "other_matches": [...]}
```

### Frontend Integration Testing

```bash
# 1. Open events.html in browser (or serve locally)
# 2. Type "Overthrow" in the search box
# 3. Click Search or trigger OCR
# Expected: Event results displayed with options
```

---

## 2. Investigation Findings

### Subtask 1-1: Data File Validation
**Status:** PASSED ✓

| File | Exists | Valid JSON | Entry Count |
|------|--------|------------|-------------|
| assets/support_card.json | ✓ | ✓ | 579 entries |
| assets/uma_data.json | ✓ | ✓ | 63 entries |
| assets/career.json | ✓ | ✓ | 9 entries |

All three JSON data files exist, are properly formatted, and contain the expected event data structures:
- **support_card.json**: Contains `EventName` and `EventOptions` fields
- **uma_data.json**: Contains uma character data with stats/aptitudes
- **career.json**: Contains career/Ura event data

### Subtask 1-2: API Startup & Data Loading
**Status:** PASSED ✓

- API module loads without errors
- **Total events loaded:** 363 (deduplicated and sorted)
- BOM-tolerant JSON loading (`utf-8-sig` encoding) works correctly
- `EVENTS`, `EVENT_MAP`, and `EVENT_NAMES` globals populated correctly
- rapidfuzz fuzzy matching initialized and functional

### Subtask 1-3: /events Endpoint
**Status:** PASSED ✓

- **HTTP Status:** 200 OK
- **Response Format:** `{"events": [...]}`
- **Event Count:** 363 event names returned
- **Response Time:** ~50ms (fast)

### Subtask 1-4: /event_by_name Endpoint
**Status:** PASSED ✓

- **HTTP Status:** 200 OK
- **Sample Query:** `event_name=Overthrow`
- **Best Match:** "Overthrow the Rival!" (score: 62.07)
- **Match Data Includes:**
  - Top Option: Guts +10, Bamboo Memory bond +5
  - Bottom Option: Maximum Energy +4, Energy -5, Bamboo Memory bond +5
- **Other Matches:** 4 alternative events with fuzzy match scores

---

## 3. Root Cause Analysis

### Finding: API Functions Correctly in Local Environment

After thorough investigation of all potential failure points, **no issues were found with the Event API in the local development environment**:

1. ✓ Data files exist and are valid JSON
2. ✓ API startup loads all 363 events successfully
3. ✓ `/events` endpoint returns complete event list
4. ✓ `/event_by_name` endpoint performs fuzzy search correctly
5. ✓ Response structures match frontend expectations

### Potential Issues Not Yet Investigated

If the original issue report mentioned problems, they may relate to:

1. **Vercel Deployment Issues**
   - Path resolution differences in serverless environment
   - Asset files not included in deployment bundle
   - Environment variable differences

2. **Frontend Integration Issues**
   - `API_BASE` URL configuration in production
   - CORS policy differences between local and production
   - JavaScript errors in browser console

3. **Network/Browser Issues**
   - Request timeouts
   - HTTPS/HTTP mixed content blocking
   - Browser caching stale responses

---

## 4. Proposed Fix

### If Issue is Deployment-Related

Since the local API works correctly, the issue may be in the Vercel deployment. Recommended actions:

1. **Verify Vercel deployment includes asset files**
   ```bash
   # Check vercel.json includes assets
   # Ensure assets/*.json are not in .gitignore
   ```

2. **Check Vercel function logs for errors**
   ```bash
   vercel logs --follow
   ```

3. **Test production endpoints directly**
   ```bash
   curl https://your-vercel-url.vercel.app/events
   curl "https://your-vercel-url.vercel.app/event_by_name?event_name=Overthrow"
   ```

### If Issue is Frontend Integration

1. **Verify API_BASE configuration in js/search.js**
   - Ensure correct protocol (https) and host for production
   - Check for hardcoded localhost URLs

2. **Check browser console for errors**
   - CORS errors indicate missing headers
   - Network errors indicate wrong API URL
   - JavaScript errors indicate frontend bugs

### Immediate Actions (Phase 2)

Based on investigation, proceed with:

1. **No code changes required for api/[...path].py** - API functions correctly
2. **Skip subtask-2-1** (Apply fix to API) - No issues found
3. **Proceed to subtask-2-2** - Verify frontend integration if needed
4. **Proceed to Phase 3** - Full verification testing

---

## 5. Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Data Files | ✓ Working | None |
| API Startup | ✓ Working | None |
| /events Endpoint | ✓ Working | None |
| /event_by_name Endpoint | ✓ Working | None |
| Frontend Integration | ⚠ Not Tested | Verify in Phase 3 |
| Production Deployment | ⚠ Not Tested | Test Vercel endpoints |

**Conclusion:** The Event API is functioning correctly in the local development environment. If issues exist, they are likely related to deployment configuration or frontend integration in production. Proceed to Phase 3 for comprehensive verification testing.

---

## 6. Evidence

### API Response Sample - /events
```json
{
  "events": [
    "\"Air Groove\" FINAL!",
    "\"King\" for a Day!",
    "\"Smashed\" Your Way to Victory!",
    "... 360 more events"
  ]
}
```

### API Response Sample - /event_by_name
```json
{
  "match": {
    "event_name": "Overthrow the Rival!",
    "score": 62.07,
    "data": {
      "event_name": "Overthrow the Rival!",
      "options": {
        "Top Option": "Guts +10, Bamboo Memory bond +5",
        "Bottom Option": "Maximum Energy +4, Energy -5, Bamboo Memory bond +5"
      }
    }
  },
  "other_matches": [
    {"event_name": "Move Over, Plato!", "score": 50.0},
    {"event_name": "To Be the Strongest", "score": 47.37},
    {"event_name": "Be the Star of the World!", "score": 45.76},
    {"event_name": "The Invincible Heroine!", "score": 45.16}
  ]
}
```
