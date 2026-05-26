/* Boot — wire up navigation, hash routing, initial render */

(function () {
  function start() {
    App.renderSidebar();
    const initial = (location.hash || '#upload').slice(1);
    const known = App.STEPS.map(s => s.id).concat(['network', 'twobytwo', 'assistant']);
    App.navigate(known.includes(initial) ? initial : 'upload');

    // anchor links in sidebar bottom
    document.querySelectorAll('.nav-link-secondary').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        App.navigate(id);
      };
    });

    // Topbar brand → home
    const brand = document.getElementById('brand-home');
    if (brand) {
      brand.style.cursor = 'pointer';
      brand.onclick = (e) => { e.preventDefault(); App.navigate('upload'); };
    }

    // User chip → simple menu
    const userChip = document.querySelector('.user-chip');
    if (userChip) {
      userChip.style.cursor = 'pointer';
      userChip.onclick = (e) => {
        e.stopPropagation();
        openUserMenu(userChip);
      };
    }

    window.addEventListener('hashchange', () => {
      const id = (location.hash || '#upload').slice(1);
      if (id && App.state.current !== id) App.navigate(id);
    });
  }

  function openUserMenu(anchor) {
    document.querySelectorAll('.user-menu').forEach(m => m.remove());
    const r = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.style.cssText = `position:fixed;top:${r.bottom + 8}px;right:${window.innerWidth - r.right}px;z-index:200;`;
    menu.innerHTML = `
      <button data-act="profile">Profile · Data Strategy Lead</button>
      <button data-act="workspace">Switch workspace</button>
      <button data-act="settings">Settings</button>
      <button data-act="docs">Help & docs</button>
      <div class="user-menu-sep"></div>
      <button data-act="signout">Sign out</button>`;
    document.body.appendChild(menu);
    const close = () => menu.remove();
    setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
    menu.querySelectorAll('button').forEach(b => {
      b.onclick = (ev) => {
        ev.stopPropagation();
        const a = b.getAttribute('data-act');
        const labels = {
          profile: 'Profile', workspace: 'Workspace switcher',
          settings: 'Settings', docs: 'Help & documentation',
          signout: 'Signing out…',
        };
        App.toast(`${labels[a] || a} — demo only`);
        close();
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
