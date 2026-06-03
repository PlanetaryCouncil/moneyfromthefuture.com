---
layout: default
title: Blog
description: Notes, updates, and archive posts from Money From The Future.
permalink: /blog/
footer_title: Blog
---
<main>
  <section class="shell hero">
    <div>
      <span class="eyebrow reveal">Blog</span>
      <h1 class="reveal delay-1">Notes From The Build.</h1>
      <p class="lead reveal delay-2">
        A tiny archive for the shop migration, old site notes, and current work in progress.
      </p>
    </div>
  </section>
  <section class="shell">
    <div class="info-grid">
      {% for post in site.posts %}
      <article class="info-card reveal delay-{{ forloop.index0 | modulo: 3 }}">
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.excerpt | strip_html | truncatewords: 22 }}</p>
      </article>
      {% endfor %}
    </div>
  </section>
</main>
