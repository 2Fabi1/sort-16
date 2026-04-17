<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { setContext } from 'svelte';

  let { children } = $props();

  let dark = $state(false);
  let notification = $state<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });
  let notificationTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      dark = true;
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
    }
  });

  function toggleTheme() {
    dark = !dark;
    if (dark) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    if (notificationTimer) clearTimeout(notificationTimer);
    notification = { message, type, visible: true };
    notificationTimer = setTimeout(() => {
      notification.visible = false;
    }, 3000);
  }

  setContext('notify', showNotification);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<button id="darkModeToggle" onclick={toggleTheme} aria-label="Toggle dark mode">
  {dark ? '🌞' : '🌙'}
</button>

<div
  id="authNotification"
  class={notification.type}
  class:visible={notification.visible}
>
  {notification.message}
</div>

{@render children()}

<style>
  #darkModeToggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100;
    background: var(--panel-bg);
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    font-size: 1.2em;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    transition: background 0.3s, transform 0.2s;
    padding: 0;
  }

  :global([data-theme='light']) #darkModeToggle {
    background: #3e4753;
    color: #f5f5f5;
  }

  :global([data-theme='dark']) #darkModeToggle {
    background: #9da3ad;
    color: #1f2937;
  }

  #darkModeToggle:hover {
    transform: scale(1.1);
  }

  #authNotification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    z-index: 100000;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    color: #fff;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  #authNotification.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  #authNotification.success {
    background: #16a34a;
  }

  #authNotification.error {
    background: #dc2626;
  }
</style>
