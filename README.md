# JoeGPT Search Normalization (Serverless API)

This is a one-endpoint project you can deploy to **Vercel** in minutes.

## Deploy (quick)
1. Create a new Vercel project, **Import** this folder, and name it **joegpt-search**.
2. Add an environment variable:
   - `REALGEEKS_SEARCH_BASE` = `https://paradiserealtyfla.realgeeks.com/search/results/`
3. Deploy. Your endpoint will be:
   `https://joegpt-search.vercel.app/api/joegpt/rg-normalize`

## Test (curl)
```
curl -X POST https://joegpt-search.vercel.app/api/joegpt/rg-normalize   -H "Content-Type: application/json"   -d '{"url":"https://paradiserealtyfla.realgeeks.com/search/results/?county=Palm+Beach&city=all&type=con&type=twn&list_price_min=50000&area_min=1000&year_built_min=2015&pool=True&hoa_yn=True&hoa_fee_min=200&hoa_fee_max=1000&garage_spaces_min=1&membership_purch_rqd=False&waterfront=No+Fixed+Bridges"}'
```

## Use in ChatGPT (Actions)
Set the **server** in your OpenAPI schema to:
`https://joegpt-search.vercel.app`

Then call POST `/api/joegpt/rg-normalize` with a JSON body containing either a `url` string or a `filter` object.
