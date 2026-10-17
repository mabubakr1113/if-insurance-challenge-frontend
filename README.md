# If Insurance Challenge — Frontend

Frontend (web UI) for our JunctionX Turku prototype for the If challenge "If Insurance Could Do More". Companion repo: `if-insurance-challenge-backend`.

## The challenge

How can insurance become useful and relevant during important life events, and give people a reason to choose and stay with If?

Build a prototype of a product, service, experience or concept that supports people through a meaningful life event (moving home, buying a car, getting married, other major changes) and shows why they would choose, use and stay with If.

This is not a "build another insurance app" challenge. The hard part is finding a real human need where an insurer can add meaningful value without making insurance the centre of the experience. The solution could:

- Prevent something from going wrong
- Simplify a difficult life change
- Guide people towards better decisions
- Offer something else that creates value for customers and, in turn, for If

It must also have a credible business case for If: retention, acquisition, risk prevention, fewer claims, efficiency or new value creation.

## Judging criteria

1. **Customer value and relevance:** a real, clearly defined human need tied to a meaningful life event.
2. **Business value for If:** a credible mechanism through which If benefits.
3. **Feasibility and scalability:** the technology, data, partners and capabilities could work in practice.
4. **Innovation and experience:** challenges the traditional role of insurance, beyond a generic app or incremental improvement.

## Resources

- Public insurance terms and conditions from If and other insurers
- If's insurances, guides and product information: [if.fi](https://www.if.fi)
- Open data such as weather and forecasting data
- Public APIs, statistics and datasets

No customer-specific or confidential insurance data is required.

## Running locally

The frontend talks only to the backend, server to server. Start the backend first (see its README), then:

```bash
npm install
cp .env.example .env.local   # BACKEND_URL=http://localhost:3001, BACKEND_API_KEY = the backend's API_KEY
npm run dev                  # http://localhost:3000
```

Checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run check:routes         # needs the backend and `npm run dev` running; resets the demo data when done
```

## Demo

Participants can open http://localhost:3000 and click **Try the demo**, or go directly to `/demo/start`. This opens the populated Lindqvist home as its coordinator, with no signup, login, invitation or personal details required. Opening the demo does not create accounts or reset data. Supabase stores the shared demo data and photos; all participants see the same changes.

The optional **Switch person** page at `/demo` lists every persona (family members, the partner, If staff) and lets you view the app as any of them, simulate a cold night, finish a partner visit, and reset all demo data. The invitation at `/invite/demo-virtanen` starts the guided main story: Aino accepts, sets up the home, invites Mikko, and the family shares the care plan.

The demo-person cookie selects a fictional role. Participants never need Supabase accounts or the backend API key; that key stays on the frontend server.

Everything simulated (weather events, SMS and email, the partner's side) is labelled as such in the UI.

## Deploying to Vercel

Deploy the backend first, then:

```bash
vercel link --yes
printf "%s" "https://YOUR-BACKEND.vercel.app" | vercel env add BACKEND_URL production
printf "%s" "THE-BACKEND-API-KEY" | vercel env add BACKEND_API_KEY production
# repeat both for the preview environment if you want preview deploys
vercel deploy --prod
```

Then open `/` and `/demo` on the production URL.

`vercel.json` places the frontend's server rendering in Dublin (`dub1`), alongside the backend and near its Supabase database. Keep both apps in the same region to avoid long server-to-server round trips on every page.
