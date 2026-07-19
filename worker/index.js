const NOT_FOUND = new Response("Not Found", {
  status: 404,
  headers: { "content-type": "text/plain; charset=utf-8" },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const assetUrl = new URL("/index.html", url.origin);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (!response.ok) return response;

      const html = (await response.text()).replaceAll("__SITE_ORIGIN__", url.origin);
      const headers = new Headers(response.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "public, max-age=300");
      return new Response(html, { status: response.status, headers });
    }

    const response = await env.ASSETS.fetch(request);
    return response.status === 404 ? NOT_FOUND : response;
  },
};
