/**
 * AeroBMSCE // Client Operations & Interactive Controls
 * 
 * Features:
 * - Real photo gallery lightbox (`photo1.jpg` - `photo8.jpg`)
 * - Squadron team tabs (Yaksha, Blue Impulse, Flying Phantoms, Vectors)
 * - Milestone timeline categorization
 * - Clean student recruitment & partnership dispatch
 * - Mobile responsive drawer menu
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initSquadronTabs();
    initPhotoLightbox();
    initMilestoneFilters();
    initContactForm();
    initMobileNav();
  });

  /* ==========================================================================
     1. SQUADRON TEAMS TABS
     ========================================================================== */
  function initSquadronTabs() {
    const tabs = document.querySelectorAll('.team-tab-btn');
    const cards = document.querySelectorAll('.team-card-pane');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTeam = tab.getAttribute('data-team');

        tabs.forEach((t) => {
          t.classList.remove('bg-orange-500', 'text-white', 'border-orange-500');
          t.classList.add('bg-slate-900/80', 'text-slate-400', 'border-slate-800');
        });
        tab.classList.add('bg-orange-500', 'text-white', 'border-orange-500');
        tab.classList.remove('bg-slate-900/80', 'text-slate-400', 'border-slate-800');

        cards.forEach((card) => {
          if (card.id === `pane-${targetTeam}`) {
            card.classList.remove('hidden');
            card.style.opacity = '0';
            setTimeout(() => { card.style.opacity = '1'; }, 30);
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ==========================================================================
     2. PHOTO GALLERY LIGHTBOX
     ========================================================================== */
  function initPhotoLightbox() {
    const lightboxModal = document.getElementById('photo-lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-thumb-item');

    galleryItems.forEach((item) => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const caption = item.getAttribute('data-caption') || img.alt;
        if (!img || !lightboxModal || !lightboxImg) return;

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        if (lightboxCaption) lightboxCaption.textContent = caption;

        lightboxModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    if (lightboxClose && lightboxModal) {
      lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.remove('open');
        document.body.style.overflow = '';
      });
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('open')) {
        lightboxModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ==========================================================================
     3. MILESTONE TIMELINE FILTERS
     ========================================================================== */
  function initMilestoneFilters() {
    const filterBtns = document.querySelectorAll('.milestone-filter-btn');
    const milestoneItems = document.querySelectorAll('.milestone-timeline-item');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        filterBtns.forEach((b) => {
          b.classList.remove('bg-orange-500', 'text-white', 'border-orange-500');
          b.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-800');
        });
        btn.classList.add('bg-orange-500', 'text-white', 'border-orange-500');
        btn.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-800');

        milestoneItems.forEach((item) => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category.includes(filter)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ==========================================================================
     4. CONTACT & RECRUITMENT DISPATCH
     ========================================================================== */
  function initContactForm() {
    const form = document.getElementById('club-contact-form');
    const modal = document.getElementById('contact-confirm-modal');
    const modalClose = document.getElementById('contact-modal-close');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-interest').value;
      const message = document.getElementById('contact-message').value.trim();

      if (!name || !email) {
        alert('Please fill out all required fields.');
        return;
      }

      // Populate confirmation receipt
      const receiptName = document.getElementById('receipt-name');
      const receiptEmail = document.getElementById('receipt-email');
      const receiptSubject = document.getElementById('receipt-subject');
      const receiptTime = document.getElementById('receipt-time');

      if (receiptName) receiptName.textContent = name;
      if (receiptEmail) receiptEmail.textContent = email;
      if (receiptSubject) receiptSubject.textContent = subject;
      if (receiptTime) receiptTime.textContent = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      form.reset();
    });

    if (modalClose && modal) {
      modalClose.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  }

  /* ==========================================================================
     5. MOBILE RESPONSIVE DRAWER
     ========================================================================== */
  function initMobileNav() {
    const toggleBtn = document.getElementById('btn-mobile-menu');
    const drawer = document.getElementById('mobile-menu-drawer');
    const links = document.querySelectorAll('.mobile-link');

    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('hidden');
    });

    links.forEach((l) => {
      l.addEventListener('click', () => {
        drawer.classList.add('hidden');
      });
    });
  }
})();
