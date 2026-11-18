# APEX Offer Intelligence

## Purpose

Offer Intelligence is a browser-local workspace for comparing up to three opportunities. It separates compensation details from a user-weighted preference matrix.

## Offer details

- Company or offer name and role title.
- Fixed annual pay and annual variable pay, labelled as INR in the current UI.
- Free-text equity/stock details so vesting schedules and instrument types are not reduced to an assumed cash value.
- Benefits, work arrangement, location and private notes.
- User-entered 1–5 ratings across compensation, career growth, role fit, flexibility, learning and manager/team.

## Decision matrix

- Users set each factor's importance from 0 to 50 in increments of five.
- The displayed score is the weighted average of the user's ratings, normalised by the sum of selected weights.
- If every weight is zero, no score is calculated.
- The ranking is a subjective preference aid based entirely on user input. It is not an objective measure of offer quality or a career recommendation.

## Privacy and export

- Offer data and ratings remain in client-side page state and are not submitted to an API or persisted to the account.
- The user can explicitly copy a comparison summary to the clipboard.
- No salary benchmark, tax calculation, equity valuation, benefits valuation or external company research is performed.

## Important considerations

Users should verify written compensation terms, variable-pay conditions, equity vesting, benefits, work expectations, notice period and contract terms. This tool does not provide legal, tax, financial or employment advice.

## Future direction

Possible extensions include optional currency selection, verified compensation inputs, saved comparisons with explicit consent, and a transparent total-compensation breakdown. Those capabilities are not implemented in this version.