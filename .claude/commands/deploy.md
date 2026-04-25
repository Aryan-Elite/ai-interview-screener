Help me deploy the project. Follow these steps in order:

1. Run /check-keys — confirm no secrets are exposed before anything else
2. Run `cd backend && npm run build` — report if TypeScript build passes or fails
3. Run `cd frontend && npm run build` — report if Next.js build passes or fails
4. If both pass, remind me to:
   - Push to GitHub: git add . && git commit -m "deploy" && git push
   - Check Render dashboard to confirm backend deployed
   - Check Vercel dashboard to confirm frontend deployed
5. Remind me to open the live Vercel URL in an incognito window and test the full interview flow
