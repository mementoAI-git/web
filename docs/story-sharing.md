# Shared story link previews

A story visible to everyone has a public link, `/post/:id`. People who open it get the app's post page. Apps that show link previews (WhatsApp, iMessage, Slack, LinkedIn, X, Facebook, Discord, Telegram) need the story's own title, excerpt and picture in the page's Open Graph tags before any JavaScript runs.

## Where the preview comes from

The API serves the preview page: `GET /public/stories/:id`. It returns small HTML with the story's `og:` and `twitter:` tags, and a "Read it on Memento" link to `/post/:id`. It only serves stories visible to everyone; anything else is a 404.

- Vercel: `api/post/[id].ts` injects the same tags into `index.html`, through the rewrite in `vercel.json`.
- Production (nginx on our server): `vercel.json` and `api/` are not used. nginx must send preview crawlers to the API page, and everyone else to the app.

## nginx

Add this to the web app's server block, before the SPA fallback. Replace `API_ORIGIN` with the API's internal or public address.

```nginx
# Link preview crawlers get the story's preview page; people get the app.
map $http_user_agent $memento_preview_bot {
    default 0;
    ~*(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|applebot|skypeuripreview|pinterest|redditbot|embedly|iframely|googlebot|bingbot) 1;
}

location ~ ^/post/([0-9a-fA-F]{24})/?$ {
    if ($memento_preview_bot) {
        rewrite ^/post/([0-9a-fA-F]{24})/?$ /public/stories/$1 break;
        proxy_pass API_ORIGIN;
    }
    try_files /index.html =404;
}
```

The `map` block goes in the `http` context. The API's `FRONTEND_URL` must be the public web origin, so the page's canonical and `og:url` point at `/post/:id`.

Profile previews (`/profile/:token`, served by `GET /public/profiles/:token`) have the same gap on nginx and can use the same pattern.

## Checking it

```sh
curl -s -A "WhatsApp/2.23" https://app.mymemento.io/post/<id> | grep og:title
```

The title should be the story's, not Memento's. Platforms cache previews, so a link already shared may keep its old card for a while.
