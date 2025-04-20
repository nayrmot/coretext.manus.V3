# Phase 1 Database Integration Implementation Steps

This document outlines the specific steps needed to complete the database integration for Phase 1 of the CoreText Document Management System.

## HTML Template Updates

### 1. Update cases.html

The cases.html file currently references a non-existent script called "cases.js". We need to update it to use our new case-listing.js file.

**Current:**
```html
<!-- Add cases.js script -->
<script src="/js/cases.js" defer></script>
```

**Change to:**
```html
<!-- Add case listing script -->
<script src="/js/case-listing.js" defer></script>
```

### 2. Update cases/new.html

The cases/new.html file needs to be updated to use our new case-form.js file.

**Current:**
```html
<!-- Add case-form.js script -->
<script src="/js/case-form.js" defer></script>
```

**Change to:**
Verify that the script tag is correctly pointing to our new file. If it's already correct, no change is needed.

### 3. Add Global Case Selector Script

The global case selector script needs to be added to all pages that include the navigation bar with the case selector. This should be added to the main layout template or to each individual page before the closing body tag.

**Add to each page:**
```html
<!-- Add global case selector script -->
<script src="/js/global-case-selector.js" defer></script>
```

## JavaScript File Adjustments

### 1. Update case-listing.js

Ensure the case-listing.js file correctly targets the elements in cases.html:

1. Verify that the table selector matches the actual table ID in cases.html
2. Ensure filter selectors match the actual filter element IDs
3. Check that the pagination selectors match the actual pagination elements

### 2. Update case-form.js

Ensure the case-form.js file correctly targets the elements in cases/new.html:

1. Verify that the form selector matches the actual form ID in cases/new.html
2. Ensure button selectors match the actual button elements
3. Check that the alert container selector matches the actual alert container element

### 3. Update global-case-selector.js

Ensure the global-case-selector.js file correctly targets the case selector element:

1. Verify that the selector matches the actual case selector ID in the navigation bar
2. Ensure the script handles case selection and navigation correctly

## Implementation Steps

### Step 1: Update HTML Files

1. **Update cases.html**:
   ```bash
   # Make a backup of the original file
   cp /home/ubuntu/coretext.manus.V3/public/cases.html /home/ubuntu/coretext.manus.V3/public/cases.html.bak
   
   # Update the script reference
   sed -i 's|<script src="/js/cases.js" defer></script>|<script src="/js/case-listing.js" defer></script>|' /home/ubuntu/coretext.manus.V3/public/cases.html
   
   # Add global case selector script before closing body tag
   sed -i 's|</body>|<script src="/js/global-case-selector.js" defer></script>\n</body>|' /home/ubuntu/coretext.manus.V3/public/cases.html
   ```

2. **Update cases/new.html**:
   ```bash
   # Make a backup of the original file
   cp /home/ubuntu/coretext.manus.V3/public/cases/new.html /home/ubuntu/coretext.manus.V3/public/cases/new.html.bak
   
   # Verify the script reference and update if needed
   # If already correct, no change needed
   
   # Add global case selector script before closing body tag
   sed -i 's|</body>|<script src="/js/global-case-selector.js" defer></script>\n</body>|' /home/ubuntu/coretext.manus.V3/public/cases/new.html
   ```

### Step 2: Verify Element IDs

1. **Check cases.html**:
   - Verify that the table has ID `casesList`
   - Verify that the status filter has ID `statusFilter`
   - Verify that the type filter has ID `typeFilter`
   - Verify that the search input has ID `searchInput`
   - Verify that the apply filters button has ID `applyFilters`
   - Verify that the select all checkbox has ID `selectAll`

2. **Check cases/new.html**:
   - Verify that the form has ID `newCaseForm`
   - Verify that the submit button is of type `submit`
   - Verify that the reset button is of type `reset`
   - Verify that the alert container has ID `alertContainer`

3. **Check navigation bar**:
   - Verify that the case selector has ID `globalCaseSelector`

### Step 3: Update JavaScript Files If Needed

If any element IDs don't match, update the corresponding JavaScript files to use the correct selectors.

### Step 4: Test the Integration

1. **Start the server**:
   ```bash
   cd /home/ubuntu/coretext.manus.V3
   node src/server.js
   ```

2. **Test case listing**:
   - Access http://localhost:3000/cases.html
   - Verify that cases are loaded from the database
   - Test filtering and pagination
   - Test case deletion

3. **Test case creation**:
   - Access http://localhost:3000/cases/new.html
   - Fill out the form and submit
   - Verify that the case is created in the database
   - Verify that validation works correctly

4. **Test global case selector**:
   - Verify that the selector is populated with cases from the database
   - Test selecting different cases
   - Test creating a new case from the selector

## Troubleshooting

### Common Issues and Solutions

1. **Cases not loading**:
   - Check browser console for errors
   - Verify that the API endpoint is correct
   - Check that the case-listing.js file is properly included
   - Verify MongoDB connection

2. **Case creation not working**:
   - Check browser console for errors
   - Verify that the API endpoint is correct
   - Check that the case-form.js file is properly included
   - Verify form field names match the expected request body

3. **Global case selector not working**:
   - Check browser console for errors
   - Verify that the API endpoint is correct
   - Check that the global-case-selector.js file is properly included
   - Verify the selector element ID

### Debugging Tips

1. Add console.log statements to track execution flow
2. Use browser developer tools to inspect network requests
3. Check server logs for any backend errors
4. Verify that the MongoDB connection is working correctly

## Completion Checklist

- [ ] Updated cases.html to use case-listing.js
- [ ] Updated cases/new.html to use case-form.js (if needed)
- [ ] Added global-case-selector.js to all pages with the navigation bar
- [ ] Verified all element IDs match the selectors in JavaScript files
- [ ] Tested case listing functionality
- [ ] Tested case creation functionality
- [ ] Tested global case selector functionality
- [ ] Updated todo.md to mark completed tasks
- [ ] Documented any issues or changes made

Once all these steps are completed, Phase 1 of the CoreText Document Management System will be fully implemented, and you'll be ready to move on to Phase 2: Document Upload & Management.
