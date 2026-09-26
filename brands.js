/**
 * KeySync Brand Icon & Metadata Registry
 * Provides official vector SVGs, high-res domain favicon auto-fetching,
 * local offline caching, and smart issuer detection.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KeySyncBrands = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Domain mappings for top services
  const BRAND_DOMAINS = {
    google: 'google.com',
    github: 'github.com',
    stripe: 'stripe.com',
    binance: 'binance.com',
    hostinger: 'hostinger.com',
    microsoft: 'microsoft.com',
    discord: 'discord.com',
    amazon: 'amazon.com',
    aws: 'aws.amazon.com',
    apple: 'apple.com',
    twitter: 'x.com',
    x: 'x.com',
    meta: 'facebook.com',
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    reddit: 'reddit.com',
    telegram: 'telegram.org',
    slack: 'slack.com',
    paypal: 'paypal.com',
    coinbase: 'coinbase.com',
    kraken: 'kraken.com',
    cloudflare: 'cloudflare.com',
    gitlab: 'gitlab.com',
    openai: 'openai.com',
    chatgpt: 'openai.com',
    notion: 'notion.so',
    steam: 'steampowered.com',
    epicgames: 'epicgames.com',
    epic: 'epicgames.com',
    proton: 'proton.me',
    shopify: 'shopify.com',
    wordpress: 'wordpress.com',
    bitwarden: 'bitwarden.com',
    onepassword: 'onepassword.com',
    '1password': 'onepassword.com',
    authy: 'authy.com',
    adobe: 'adobe.com',
    dropbox: 'dropbox.com',
    twitch: 'twitch.tv',
    linkedin: 'linkedin.com',
    uber: 'uber.com',
    airbnb: 'airbnb.com',
    netflix: 'netflix.com',
    spotify: 'spotify.com',
    zoom: 'zoom.us',
    trello: 'trello.com',
    atlassian: 'atlassian.com',
    jira: 'atlassian.com',
    vercel: 'vercel.com',
    supabase: 'supabase.com',
    digitalocean: 'digitalocean.com',
    heroku: 'heroku.com',
    namecheap: 'namecheap.com',
    godaddy: 'godaddy.com',
    kucoin: 'kucoin.com',
    bybit: 'bybit.com',
    okx: 'okx.com',
    bitfinex: 'bitfinex.com'
  };

  // Curated, authentic SVGs for popular 2FA services (used as instant offline fallbacks)
  const BRAND_ICONS = {
    google: {
      name: 'Google',
      domain: 'google.com',
      color: '#4285F4',
      bg: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>`
    },

    github: {
      name: 'GitHub',
      domain: 'github.com',
      color: '#FFFFFF',
      bg: '#181B20',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>`
    },

    stripe: {
      name: 'Stripe',
      domain: 'stripe.com',
      color: '#FFFFFF',
      bg: '#635BFF',
      svg: `<svg viewBox="0 0 24 26" width="22" height="24" fill="#FFFFFF">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.652.71 15.018 0 12.08 0 5.437 0 1.272 3.513 1.272 8.95c0 5.867 4.982 7.025 8.653 8.358 2.502.909 3.36 1.543 3.36 2.535 0 .977-.852 1.503-2.316 1.503-2.366 0-5.333-1.127-7.227-2.222l-.934 5.568C4.697 25.534 8.27 26 11.666 26c6.942 0 11.062-3.398 11.062-9.037 0-5.71-4.707-6.996-8.752-8.813z"/>
      </svg>`
    },

    binance: {
      name: 'Binance',
      domain: 'binance.com',
      color: '#F0B90B',
      bg: '#181A20',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#F0B90B">
        <path d="M16.624 13.92l2.715 2.715-7.34 7.34-7.34-7.34 2.715-2.715 4.625 4.625 4.625-4.625zm4.661-4.661L24 12l-2.715 2.741-2.715-2.741 2.715-2.741zM11.999 0l7.34 7.34-2.715 2.715-4.625-4.625-4.625 4.625L4.659 7.34 11.999 0zM2.715 9.259L5.43 12l-2.715 2.741L0 12l2.715-2.741zM12 8.354L15.646 12 12 15.646 8.354 12 12 8.354z"/>
      </svg>`
    },

    hostinger: {
      name: 'Hostinger',
      domain: 'hostinger.com',
      color: '#FFFFFF',
      bg: '#673DE6',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M14.542 0L6.75 4.5v15l7.792 4.5 7.792-4.5V4.5L14.542 0zm-4.792 6.75l4.792-2.766 4.792 2.766v10.5l-4.792 2.766-4.792-2.766V6.75z"/>
      </svg>`
    },

    microsoft: {
      name: 'Microsoft',
      domain: 'microsoft.com',
      color: '#00A4EF',
      bg: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      svg: `<svg viewBox="0 0 24 24" width="20" height="20">
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
        <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
      </svg>`
    },

    discord: {
      name: 'Discord',
      domain: 'discord.com',
      color: '#FFFFFF',
      bg: '#5865F2',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>`
    },

    amazon: {
      name: 'Amazon',
      domain: 'amazon.com',
      color: '#FF9900',
      bg: '#232F3E',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF9900">
        <path d="M13.9 14.5c-2.4 1.8-6.1 2.7-9.1 2.7-4.3 0-8.2-1.6-11.1-4.3-.2-.2 0-.5.3-.4 3.2 1.8 7.1 2.9 11.1 2.9 2.7 0 5.9-.6 8.7-1.9.4-.2.7.3.1 1zm1.3-.8c-.3-.4-2-.2-3.5.1-.2 0-.2-.2 0-.3 1.3-.9 3.5-.6 3.9-.1.3.4.1 2.6-.9 3.8-.2.2-.3.1-.2 0 .5-.8.9-2.9.7-3.5z"/>
        <path fill="#FFFFFF" d="M15.4 7.7c-.1-.7-.5-1.1-1.1-1.3-.8-.3-1.8-.1-2.4.6l-1 1.2c-.3.4-.6.8-.9 1.2-.2.2-.4.4-.6.5-.4.3-.8.4-1.3.4-.8 0-1.4-.4-1.7-1.1-.3-.7-.2-1.6.3-2.2.6-.7 1.5-1.1 2.5-1.2h.7V3.5h-.7C7.6 3.6 6 4.3 4.8 5.6c-.9 1-1.4 2.4-1.3 3.8.1 1.4.9 2.7 2.1 3.5 1 .6 2.1.9 3.3.9 1.2 0 2.3-.3 3.3-.9l1.1 1.3 1.3-1.1-1.2-1.4c1.1-1.1 1.9-2.5 2-4z"/>
      </svg>`
    },

    apple: {
      name: 'Apple',
      domain: 'apple.com',
      color: '#FFFFFF',
      bg: '#1C1C1E',
      svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.2c.62-.75 1.04-1.8 1.01-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.73-.93 2.75 1 .08 2.01-.5 2.54-1.25z"/>
      </svg>`
    },

    twitter: {
      name: 'X (Twitter)',
      domain: 'x.com',
      color: '#FFFFFF',
      bg: '#000000',
      svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>`
    },

    meta: {
      name: 'Meta',
      domain: 'facebook.com',
      color: '#FFFFFF',
      bg: '#0081FB',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
      </svg>`
    },

    instagram: {
      name: 'Instagram',
      domain: 'instagram.com',
      color: '#FFFFFF',
      bg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>`
    },

    reddit: {
      name: 'Reddit',
      domain: 'reddit.com',
      color: '#FFFFFF',
      bg: '#FF4500',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.56 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>`
    },

    telegram: {
      name: 'Telegram',
      domain: 'telegram.org',
      color: '#FFFFFF',
      bg: '#24A1DE',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/>
      </svg>`
    },

    slack: {
      name: 'Slack',
      domain: 'slack.com',
      color: '#E01E5A',
      bg: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
      </svg>`
    },

    paypal: {
      name: 'PayPal',
      domain: 'paypal.com',
      color: '#FFFFFF',
      bg: '#003087',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.82.876 4.965-.678 3.39-2.88 5.688-6.545 5.688H10.15l-1.33 6.94a.642.642 0 0 1-.634.544l-1.11.002z"/>
        <path fill="#0079C1" d="M19.13 6.812c-.678 3.39-2.88 5.688-6.545 5.688H9.257l-1.87 9.761a.642.642 0 0 0 .633.74h3.632a.642.642 0 0 0 .633-.52l.968-5.06h1.564c3.666 0 6.545-2.298 7.223-5.688.428-2.144.133-3.815-.877-4.965a4.42 4.42 0 0 0-2.033-1.07l.124-.626z"/>
      </svg>`
    },

    coinbase: {
      name: 'Coinbase',
      domain: 'coinbase.com',
      color: '#FFFFFF',
      bg: '#0052FF',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2.14 7.2h4.28a4.8 4.8 0 1 1 0 9.6H9.86a4.8 4.8 0 1 1 0-9.6zm2.14 2.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"/>
      </svg>`
    },

    kraken: {
      name: 'Kraken',
      domain: 'kraken.com',
      color: '#FFFFFF',
      bg: '#5741D9',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 4.14 2.1 7.79 5.28 9.93l1.83-3.48A7.88 7.88 0 0 1 4.14 12C4.14 7.66 7.66 4.14 12 4.14S19.86 7.66 19.86 12a7.88 7.88 0 0 1-2.97 6.45l1.83 3.48A11.94 11.94 0 0 0 24 12C24 5.37 18.63 0 12 0zm-2.4 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zm4.8 0a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"/>
      </svg>`
    },

    cloudflare: {
      name: 'Cloudflare',
      domain: 'cloudflare.com',
      color: '#FFFFFF',
      bg: '#F38020',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M18.3 10.4c-.4-2.8-2.8-5-5.7-5-2.2 0-4.1 1.2-5.1 3-.3 0-.6-.1-.9-.1C3 8.3.8 10.5.8 13.2c0 2.6 2.1 4.7 4.7 4.8h12.7c2.6 0 4.8-2.1 4.8-4.8 0-2.3-1.6-4.2-3.8-4.6-.3-.7-.9-1.3-1.5-1.7-.1-.2-.2-.3-.4-.5z"/>
      </svg>`
    },

    gitlab: {
      name: 'GitLab',
      domain: 'gitlab.com',
      color: '#FFFFFF',
      bg: '#292961',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22">
        <path fill="#E24329" d="M12 21.417L15.65 10.19H8.35L12 21.417z"/>
        <path fill="#FC6D26" d="M12 21.417l3.65-11.227h4.868L12 21.417z"/>
        <path fill="#FCA326" d="M20.518 10.19l1.897 5.84a.8.8 0 0 1-.29.894L12 21.417l8.518-11.227z"/>
        <path fill="#E24329" d="M20.518 10.19H15.65l2.062-6.347a.43.43 0 0 1 .818 0l1.988 6.347z"/>
        <path fill="#FC6D26" d="M12 21.417L8.35 10.19H3.482L12 21.417z"/>
        <path fill="#FCA326" d="M3.482 10.19L1.585 16.03a.8.8 0 0 0 .29.894L12 21.417 3.482 10.19z"/>
        <path fill="#E24329" d="M3.482 10.19H8.35L6.288 3.843a.43.43 0 0 0-.818 0L3.482 10.19z"/>
      </svg>`
    },

    openai: {
      name: 'OpenAI',
      domain: 'openai.com',
      color: '#FFFFFF',
      bg: '#10A37F',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.784a4.472 4.472 0 0 1 2.366-1.973v5.683a.79.79 0 0 0 .388.681l5.861 3.383-2.02 1.168a.076.076 0 0 1-.071 0l-4.839-2.79A4.504 4.504 0 0 1 2.34 8.784zm16.597 3.855l-5.843-3.37v-2.33a.08.08 0 0 1 .033-.062l4.84-2.795a4.5 4.5 0 0 1 6.674 4.66l-.141-.085-4.786-2.763a.76.76 0 0 0-.777 0zm2.01-4.717a4.477 4.477 0 0 1-.486 3.013l-4.779-2.76a.79.79 0 0 0-.78 0L9.04 11.558V9.226a.076.076 0 0 1 .033-.062l4.839-2.795a4.504 4.504 0 0 1 5.025.798zm-8.878 5.617l-2.6-1.5 2.6-1.5 2.6 1.5-2.6 1.5z"/>
      </svg>`
    },

    notion: {
      name: 'Notion',
      domain: 'notion.so',
      color: '#000000',
      bg: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#000000">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.458-.84c1.12-.093 1.213-.42 1.213-1.026 0-.373-.28-.653-.653-.653-.373 0-.746.093-1.306.14L5.672 3.135c-.84.093-1.213.513-1.213 1.073zm.187 3.545v12.24c0 .84.42 1.306 1.306 1.306.653 0 1.026-.093 1.4-.28l12.438-1.073c.933-.093 1.213-.653 1.213-1.4V6.26c0-.746-.42-1.213-1.213-1.213-.56 0-.84.093-1.213.187l-12.718.933c-.746.093-1.213.653-1.213 1.586zm12.345 1.586c.093.466.093 1.026.093 1.586v6.252c0 .56-.187.933-.56.933-.373 0-.56-.187-.84-.56l-5.6-7.558v6.72c0 .653.28 1.026.933 1.12.28.046.466.093.466.373 0 .373-.373.466-.84.466l-2.8-.093c-.28 0-.466-.093-.466-.373 0-.28.187-.373.466-.42.653-.093.933-.466.933-1.12V8.966c0-.56-.28-.933-.933-1.026-.28-.046-.466-.093-.466-.373 0-.373.373-.466.84-.466l3.08.093c.466 0 .84.187 1.12.56l5.413 7.372V8.966c0-.653-.28-1.026-.933-1.12-.28-.046-.466-.093-.466-.373 0-.373.373-.466.84-.466l2.428.093c.28 0 .466.093.466.373 0 .28-.187.373-.466.42-.653.093-.84.466-.746 1.026z"/>
      </svg>`
    },

    steam: {
      name: 'Steam',
      domain: 'steampowered.com',
      color: '#FFFFFF',
      bg: '#171A21',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zM8.366 14.865l-1.92-.793c.277.581.74 1.049 1.326 1.319.432.199.914.287 1.396.257l-.802-1.942v.001c.29-.071.558-.22.777-.442l-.777 1.6zM15.94 6.138c-1.53 0-2.772 1.243-2.772 2.772 0 1.531 1.242 2.774 2.772 2.774 1.531 0 2.773-1.243 2.773-2.774 0-1.529-1.242-2.772-2.773-2.772z"/>
      </svg>`
    },

    epicgames: {
      name: 'Epic Games',
      domain: 'epicgames.com',
      color: '#FFFFFF',
      bg: '#2A2A2A',
      svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF">
        <path d="M4.5 1.5h15l1.5 13.5-9 7.5-9-7.5zM12 4.5L7.5 7.5v6.5l4.5 3.5 4.5-3.5V7.5z"/>
      </svg>`
    },

    proton: {
      name: 'Proton',
      domain: 'proton.me',
      color: '#FFFFFF',
      bg: '#6D4AFF',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 3.7 2.01 6.94 5 8.68V12h10v8.68c2.99-1.74 5-4.98 5-8.68 0-5.52-4.48-10-10-10zm-2 15h4v2h-4v-2z"/>
      </svg>`
    },

    shopify: {
      name: 'Shopify',
      domain: 'shopify.com',
      color: '#FFFFFF',
      bg: '#96BF48',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M21.2 5.5l-1.9-.6s-1.3-1.3-1.9-1.5c-.6-.2-1.7-.1-1.7-.1s-.6-.7-.9-.9c-.3-.2-1-.2-1-.2s-.4-1.3-1.2-1.8C11.7-.1 10.5 0 10.5 0S9.9.1 9.4.5C8.9.9 7.7 2.5 7.3 3.3L4.8 4.2C4 4.5 3.9 5.3 3.9 5.3L2.2 18.2 12 24l9.8-5.8L21.2 5.5zm-8.8-2.6c.4 0 .9.3 1.2.7.3.4.4.9.4 1.4l-3.2.9c.2-.9.7-2.3 1.6-3zm-1.8 13.4c-2.3 0-3.3-1.2-3.3-2.4 0-1.8 2.2-2.3 3.7-2.6.9-.2 1.4-.4 1.4-.9 0-.6-.5-.9-1.3-.9-.9 0-1.5.3-2 .7l-.7-1.4c.8-.7 1.8-1 2.8-1 1.7 0 3 1 3 2.6v4.6h-1.6v-1.1c-.6.8-1.3 1-2 1z"/>
      </svg>`
    },

    wordpress: {
      name: 'WordPress',
      domain: 'wordpress.com',
      color: '#FFFFFF',
      bg: '#21759B',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.92 18.49L7.33 7.82c.57-.03 1.09-.09 1.09-.09.43-.05.38-.72-.05-.7l-3.08.24c-.43.02-.38.7.05.69 0 0 .5.06 1.03.09l4.5 12.44zm2.14 0l3.07-8.91c.28-.73.49-1.28.49-1.74 0-.82-.29-1.39-.58-1.85-.38-.6-.74-1.11-.74-1.71 0-.68.52-1.31 1.26-1.31.06 0 .11 0 .17.01C19.64 5.35 21.6 8.44 21.6 12c0 3.3-1.66 6.22-4.19 7.97l-3.03-8.98zM12 1.44c2.51 0 4.8 1 6.5 2.61-.13.01-.25.04-.37.04-1.28 0-2.18.99-2.18 2.08 0 .86.5 1.72 1.02 2.58.39.67.87 1.54.87 2.76 0 .5-.07 1.07-.26 1.74L14.7 21.14C13.83 21.7 12.83 22.02 11.75 22.02c-1.14 0-2.2-.34-3.1-.94L12 6.81l2.42 6.64 1.34-3.95c.2-.56.34-1.11.34-1.61 0-1.17-.83-1.89-1.92-1.89-.09 0-.17.01-.26.02L12 1.44zM2.4 12c0-2.73 1.14-5.2 2.98-6.97L1.87 17.51C1.04 15.86.58 14 .58 12.03L2.4 12z"/>
      </svg>`
    },

    bitwarden: {
      name: 'Bitwarden',
      domain: 'bitwarden.com',
      color: '#FFFFFF',
      bg: '#175DDC',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0L2 4v8c0 7.33 4.27 14.18 10 16 5.73-1.82 10-8.67 10-16V4l-10-4zm0 3.25l7.5 3v5.75c0 5.46-3.19 10.57-7.5 12-4.31-1.43-7.5-6.54-7.5-12V6.25l7.5-3zM12 6v12c2.76 0 5-2.24 5-5s-2.24-5-5-5V6z"/>
      </svg>`
    },

    onepassword: {
      name: '1Password',
      domain: 'onepassword.com',
      color: '#FFFFFF',
      bg: '#0A85EA',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.8a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4zm0 2.4a4.8 4.8 0 0 0-1.8 9.25V14.4h3.6v2.05A4.8 4.8 0 0 0 12 7.2zm0 2.4a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z"/>
      </svg>`
    },

    authy: {
      name: 'Authy',
      domain: 'authy.com',
      color: '#FFFFFF',
      bg: '#EC1C24',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <circle cx="12" cy="12" r="10" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>
        <circle cx="12" cy="12" r="4.5" fill="#FFFFFF"/>
      </svg>`
    },

    adobe: {
      name: 'Adobe',
      domain: 'adobe.com',
      color: '#FFFFFF',
      bg: '#FA0F00',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M14.58 2.4H24v19.2h-5.26l-4.16-9.6zm-5.16 0H0v19.2h5.26l4.16-9.6zm2.58 7.02l3.78 8.82h-3.14l-1.32-3.12h-2.14l2.12-4.98z"/>
      </svg>`
    },

    dropbox: {
      name: 'Dropbox',
      domain: 'dropbox.com',
      color: '#FFFFFF',
      bg: '#0061FF',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4L6 2zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4-6-4zM6 18.5l6 4 6-4-6-4-6 4z"/>
      </svg>`
    },

    twitch: {
      name: 'Twitch',
      domain: 'twitch.tv',
      color: '#FFFFFF',
      bg: '#9146FF',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M4.5 0L1.5 4.5v16.5h6V24l3-3h4.5l7.5-7.5V0H4.5zm16.5 12l-3 3h-4.5l-3 3v-3H6V3h15v9zm-7.5-6h3v6h-3V6zm-6 0h3v6h-3V6z"/>
      </svg>`
    },

    linkedin: {
      name: 'LinkedIn',
      domain: 'linkedin.com',
      color: '#FFFFFF',
      bg: '#0A66C2',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>`
    }
  };

  // Curated modern squircle gradients for unlisted brands
  const FALLBACK_GRADIENTS = [
    { from: '#4F46E5', to: '#7C3AED' }, // Indigo-Violet
    { from: '#2563EB', to: '#06B6D4' }, // Blue-Cyan
    { from: '#059669', to: '#10B981' }, // Emerald
    { from: '#D97706', to: '#F59E0B' }, // Amber
    { from: '#DC2626', to: '#F43F5E' }, // Rose-Red
    { from: '#0284C7', to: '#38BDF8' }, // Sky
    { from: '#7C2D12', to: '#EA580C' }, // Copper
    { from: '#0F172A', to: '#334155' }  // Slate Carbon
  ];

  /**
   * Sanitizes domain string
   */
  function cleanDomain(str) {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split(':')[0]
      .trim();
  }

  /**
   * Generates high-res favicon URL (128x128)
   */
  function getFaviconUrl(domain) {
    if (!domain) return '';
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${encodeURIComponent(domain)}&size=128`;
  }

  /**
   * Extracts clean domain from service name, account label, or search string
   */
  function extractDomain(displayName, rawName, searchTarget) {
    // 1. Direct dictionary match
    for (const key of Object.keys(BRAND_DOMAINS)) {
      if (searchTarget.includes(key)) {
        return BRAND_DOMAINS[key];
      }
    }

    // 2. Check if displayName has domain format like "alis.co", "site.org", etc.
    const domainRegex = /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/;
    const issuerMatch = displayName.match(domainRegex);
    if (issuerMatch) {
      return cleanDomain(issuerMatch[1]);
    }

    // 3. Check if rawName has an email with domain (e.g. user@alis.co)
    if (rawName && rawName.includes('@')) {
      const emailDomain = rawName.split('@')[1];
      const match = emailDomain.match(domainRegex);
      if (match) {
        return cleanDomain(match[1]);
      }
    }

    // 4. If single clean word without spaces, try .com
    const cleanWord = displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleanWord.length >= 3 && !cleanWord.includes(' ') && cleanWord !== 'account' && cleanWord !== 'keysync') {
      return cleanWord + '.com';
    }

    return null;
  }

  /**
   * Smartly resolves clean issuer, brand, account name and branding.
   * Auto-resolves domain and high-res favicon URL with local cache support.
   */
  function resolveAccountBranding(acc, logoCache) {
    let rawIssuer = (acc.issuer || '').trim();
    let rawName = (acc.name || '').trim();

    // 1. Separate combined strings like "Binance:alice@gmail.com"
    if (rawName.includes(':')) {
      const parts = rawName.split(':');
      if (!rawIssuer || rawIssuer.toLowerCase() === 'account') {
        rawIssuer = parts[0].trim();
      }
      rawName = parts.slice(1).join(':').trim();
    }

    // 2. Parenthetical label like "alice@gmail.com (Binance)"
    const parenMatch = rawName.match(/\(([^)]+)\)$/);
    if (parenMatch && (!rawIssuer || rawIssuer.toLowerCase() === 'account')) {
      rawIssuer = parenMatch[1].trim();
      rawName = rawName.replace(/\s*\([^)]+\)$/, '').trim();
    }

    // 3. If issuer is still "Account" or empty, inspect rawName
    if (!rawIssuer || rawIssuer.toLowerCase() === 'account') {
      const lowerName = rawName.toLowerCase();
      for (const key of Object.keys(BRAND_ICONS)) {
        if (lowerName === key || lowerName.startsWith(key)) {
          rawIssuer = BRAND_ICONS[key].name;
          rawName = rawName.substring(key.length).replace(/^[\s\-_:]+/, '') || rawName;
          break;
        }
      }
    }

    // 4. If issuer is empty and name has an email, extract domain
    if (!rawIssuer && rawName && rawName.includes('@')) {
      const parts = rawName.split('@');
      rawIssuer = parts[1].trim();
    }

    if (!rawIssuer) {
      rawIssuer = rawName ? rawName : 'Account';
    }

    // Lookup matching brand in registry
    const searchTarget = (rawIssuer + ' ' + rawName).toLowerCase();
    let matchedBrandKey = null;

    for (const key of Object.keys(BRAND_ICONS)) {
      if (
        searchTarget.includes(key) ||
        (key === 'amazon' && searchTarget.includes('aws')) ||
        (key === 'twitter' && (searchTarget.includes('twitter') || searchTarget.includes(' x '))) ||
        (key === 'meta' && (searchTarget.includes('facebook') || searchTarget.includes('meta'))) ||
        (key === 'openai' && (searchTarget.includes('chatgpt') || searchTarget.includes('openai'))) ||
        (key === 'proton' && searchTarget.includes('protonmail'))
      ) {
        matchedBrandKey = key;
        break;
      }
    }

    let brandInfo = matchedBrandKey ? BRAND_ICONS[matchedBrandKey] : null;

    // Display Issuer & Account label
    let displayName = rawIssuer;
    if (brandInfo && (displayName.toLowerCase() === 'account' || displayName.toLowerCase() === matchedBrandKey)) {
      displayName = brandInfo.name;
    } else if (displayName.toLowerCase() === 'account' && rawName) {
      displayName = rawName;
      rawName = '';
    }

    let displayAccount = rawName;
    if (displayAccount === displayName) {
      displayAccount = '';
    }

    // --- Resolve Domain for Live Favicon Auto-Fetching ---
    let domain = null;
    if (acc.domain) {
      domain = cleanDomain(acc.domain);
    } else if (brandInfo && brandInfo.domain) {
      domain = brandInfo.domain;
    } else {
      domain = extractDomain(displayName, rawName, searchTarget);
    }

    const cachedDataUrl = (logoCache && domain && logoCache[domain]) ? logoCache[domain] : null;
    const faviconUrl = cachedDataUrl || (domain ? getFaviconUrl(domain) : '');
    const isCached = !!cachedDataUrl;

    // Monogram / Fallback Calculation
    let hash = 0;
    const str = displayName || 'A';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const palette = FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
    
    let monogram = str.substring(0, 1).toUpperCase();
    const words = str.split(/[\s\-_.]+/).filter(Boolean);
    if (words.length >= 2) {
      monogram = (words[0][0] + words[1][0]).toUpperCase();
    } else if (str.length >= 2 && !/[0-9]/.test(str[1])) {
      monogram = str.substring(0, 2);
    }

    let fallbackContent = '';
    let fallbackStyle = '';
    if (brandInfo && brandInfo.svg) {
      fallbackStyle = `background: ${brandInfo.bg || '#FFFFFF'}; ${brandInfo.border ? `box-shadow: inset 0 0 0 1px ${brandInfo.border};` : ''}`;
      fallbackContent = brandInfo.svg;
    } else {
      fallbackStyle = `background: linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%);`;
      fallbackContent = `<span class="monogram-text">${escapeHtml(monogram)}</span>`;
    }

    // Build Modern Avatar HTML with High-Res Image & Graceful Fallback
    const avatarHtml = `
      <div class="service-avatar brand-avatar" data-domain="${escapeHtml(domain || '')}">
        ${faviconUrl ? `
          <img class="brand-logo-img ${isCached ? 'loaded' : ''}" 
               src="${escapeHtml(faviconUrl)}" 
               alt="${escapeHtml(displayName)}" 
               loading="lazy" />
        ` : ''}
        <div class="avatar-fallback ${brandInfo ? 'brand-svg-fallback' : 'monogram-avatar'}" 
             style="${fallbackStyle} ${isCached ? 'opacity: 0;' : ''}">
          ${fallbackContent}
        </div>
      </div>`;

    return {
      issuer: displayName,
      account: displayAccount,
      domain,
      avatarHtml,
      brandKey: matchedBrandKey
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    BRAND_ICONS,
    BRAND_DOMAINS,
    cleanDomain,
    getFaviconUrl,
    extractDomain,
    resolveAccountBranding
  };
});
