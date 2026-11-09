# Frame Garage – custom die-cast shadowbox builder (GitHub Pages + Google Sheet)

## A. Backend (Google Sheet + Apps Script)
1. Create a new Google Sheet (any name).
2. **Extensions > Apps Script**. Delete the sample code, paste all of `Code.gs`, click **Save**.
3. **Project Settings (gear) > Script Properties > Add** `ADMIN_PASSWORD` (your password).
   If the project was created from script.google.com instead of the Sheet menu, also add `SHEET_ID` (the long id between `/d/` and `/edit` in the Sheet's address).
4. Choose **setup** in the function dropdown, click **Run**, approve permissions. It creates three tabs:
   - `Slots_Availability` (Frame_ID, Frame_Name, Total_Slots, Booked_Slots, Is_Available, plus Price, Image_URL, Description, Max_Cars)
   - `Orders` (Order_ID … Status, plus Frame_ID, Background, Notes)
   - `Settings` (shop name, **WhatsApp number**, LED options and prices, background colours, plaque text price)
5. Open the **Settings** tab and set `WHATSAPP` to the shop's number: country code + number, digits only (e.g. 919876543210). Orders still save without it, but the customer will not get a WhatsApp link.

## B. Deploy as a Web App
1. **Deploy > New deployment > gear icon > Web app**.
2. Description: anything. **Execute as: Me**. **Who has access: Anyone**. Click **Deploy**, approve permissions (Advanced > Go to project if Google warns).
3. Copy the **Web app URL** (ends in `/exec`). Open it in a browser: you should see JSON with your frames.
4. **After every change to Code.gs:** Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy. The URL stays the same.

### How CORS works here
Apps Script cannot add CORS headers. The site sends `fetch()` POSTs with `Content-Type: text/plain` (a "simple request", so no preflight) and the script reads `e.postData.contents`. Google serves web-app JSON responses with `Access-Control-Allow-Origin: *`, so GitHub Pages can call it. Do not change the content type to `application/json`.

## C. Cloudinary (customer reference images)
Settings > Upload > Upload presets > Add: signing mode **Unsigned**, folder **frames**. Note the cloud name and preset name. Customer images upload straight from the browser; the order stores the link.

## D. Frontend on GitHub Pages
1. Edit `config.js`: Web App URL, Cloudinary cloud name, preset name, shop name, and the WhatsApp message templates.
2. Upload `index.html, admin.html, app.js, admin.js, style.css, config.js` to a repo, then **Settings > Pages > Deploy from branch**.
3. Customers: `your-site/`   Admin: `your-site/admin.html`

## E. How slots and orders work
- Each frame has `Total_Slots`. Every order takes one slot (`Booked_Slots` + 1) and `Is_Available` turns false at the limit, so the frame shows **Sold out**.
- Prices are calculated on the server (frame + LED + plaque text + optional per-car price from Settings), never trusted from the browser.
- Admin: confirm / complete / cancel orders (cancel releases the slot, reopen takes it back), edit frames, slots and prices. Each action can open WhatsApp with a ready message; the admin presses Send.
- The order response includes `wa.url` and `wa.message` for the customer's WhatsApp redirect. The customer presses Send; an order is not confirmed until the shop replies.
