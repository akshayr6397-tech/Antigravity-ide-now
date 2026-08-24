/**
 * ASTROCAL — Notification & Calendar Sync Engine
 * 1. Google Calendar Direct Deep-Linking
 * 2. RFC-5545 .ics iCalendar file generation & download
 * 3. Browser Desktop Web Notification API
 * 4. In-App Notification Center Drawer
 */

class NotificationEngine {
  constructor() {
    this.notifications = [
      {
        id: 'alert-1',
        title: 'Perseid Meteor Shower Peak Tonight',
        location: 'Pune, India & Global',
        time: 'Aug 30, 9:00 PM – 4:30 AM',
        icon: '☄️',
        read: false,
        eventId: 'perseids-2026'
      },
      {
        id: 'alert-2',
        title: 'ISS High Elevation Flyover (Mag -3.9)',
        location: 'Pune, India (Visible SW to NE)',
        time: 'Aug 28, 7:42 PM',
        icon: '🛰️',
        read: false,
        eventId: 'iss-pass-pune'
      },
      {
        id: 'alert-3',
        title: 'Total Solar Eclipse Warning',
        location: 'Northern Spain / Iceland (Live stream global)',
        time: 'Sep 12, 5:35 PM UTC',
        icon: '🌑',
        read: true,
        eventId: 'solar-eclipse-2026'
      }
    ];

    this.init();
  }

  init() {
    this.updateNotificationBadge();
    this.bindDrawer();
  }

  updateNotificationBadge() {
    const badge = document.getElementById('notif-badge-count');
    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  bindDrawer() {
    const bellBtn = document.getElementById('btn-notif-drawer');
    const drawer = document.getElementById('notif-drawer');
    const closeBtn = document.getElementById('btn-close-notif');

    if (bellBtn && drawer) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.toggle('active');
        this.renderDrawerList();
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    }

    document.addEventListener('click', (e) => {
      if (drawer && !drawer.contains(e.target) && !bellBtn.contains(e.target)) {
        drawer.classList.remove('active');
      }
    });

    const testAlertBtn = document.getElementById('btn-test-alert');
    if (testAlertBtn) {
      testAlertBtn.addEventListener('click', () => {
        this.requestDesktopNotification('Perseid Meteor Shower Peak', 'Optimal viewing in Pune starts at 9:30 PM tonight. Expect 100+ meteors/hr under dark skies!');
      });
    }
  }

  renderDrawerList() {
    const container = document.getElementById('notif-list-container');
    if (!container) return;

    container.innerHTML = '';
    this.notifications.forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${n.read ? 'read' : 'unread'}`;
      item.innerHTML = `
        <div class="notif-item-icon">${n.icon}</div>
        <div class="notif-item-content">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-sub">📍 ${n.location}</div>
          <div class="notif-item-time">⏰ ${n.time}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        n.read = true;
        this.updateNotificationBadge();
        item.classList.remove('unread');
        item.classList.add('read');
        if (window.app) window.app.openEventDetail(n.eventId);
      });

      container.appendChild(item);
    });
  }

  /* --- 1. GOOGLE CALENDAR DEEP LINK GENERATOR --- */
  createGoogleCalendarLink(event, userLocationName = 'Pune, India') {
    const title = encodeURIComponent(`🌌 Celestial Event: ${event.title}`);
    const details = encodeURIComponent(
      `ASTROCAL TRACKER CELESTIAL ALERT\n\nEvent: ${event.title}\nRate: ${event.rate}\nRadiant/Coordinates: ${event.radiant}\nEquipment: ${event.equipment}\nOptimal Sky: ${event.bortleOptimal}\n\nViewing Tips:\n${event.viewingTips}\n\nTracked via AstroCal Tracker — Your Gateway to the Universe.`
    );
    const location = encodeURIComponent(`${userLocationName} (Look ${event.altitude || 'Overhead'})`);

    // Format dates: YYYYMMDDTHHMMSSZ (approximate 3 hour observation window)
    const dateClean = event.date.replace(/-/g, '');
    const startTime = `${dateClean}T153000Z`;
    const endTime = `${dateClean}T193000Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  }

  /* --- 2. RFC-5545 .ICS ICALENDAR FILE GENERATOR & DOWNLOADER --- */
  downloadIcsFile(event, userLocationName = 'Pune, India') {
    const dateClean = event.date.replace(/-/g, '');
    const startTime = `${dateClean}T153000Z`;
    const endTime = `${dateClean}T193000Z`;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AstroCal Tracker//Celestial Event Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:astrocal-${event.id}-${Date.now()}@astrocal.space`,
      `DTSTAMP:${now}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:🌌 ${event.title}`,
      `DESCRIPTION:Celestial observation reminder for ${event.title}. Radiant: ${event.radiant}. Equipment: ${event.equipment}. Viewing Tips: ${event.viewingTips.replace(/\n/g, ' ')}`,
      `LOCATION:${userLocationName} (Direction: ${event.altitude || 'Overhead'})`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${event.title} peaks in 2 hours! Prepare your stargazing spot.`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.id}-reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app.showToast(`📅 Downloaded Apple/Outlook .ics reminder for "${event.title}"`);
  }

  /* --- 3. BROWSER DESKTOP NOTIFICATION API --- */
  async requestDesktopNotification(title, body, eventId = null) {
    if (!('Notification' in window)) {
      window.app.showToast('⚠️ Desktop notifications not supported by this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      this.sendDesktopNotification(title, body, eventId);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.sendDesktopNotification(title, body, eventId);
      } else {
        window.app.showToast('Desktop notification permission was denied.');
      }
    } else {
      window.app.showToast('Desktop notifications are blocked in your browser settings.');
    }
  }

  sendDesktopNotification(title, body, eventId = null) {
    const notif = new Notification(`🌌 AstroCal Tracker Alert: ${title}`, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/3247/3247310.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3247/3247310.png'
    });

    notif.onclick = () => {
      window.focus();
      if (eventId && window.app) {
        window.app.openEventDetail(eventId);
      }
    };

    window.app.showToast(`🔔 Triggered notification for: ${title}`);
  }

  /* --- 4. SHOW LOCALIZED POPUP REMINDER CARD --- */
  showEventAlertToast(event, locationName = 'Pune') {
    const toast = document.createElement('div');
    toast.className = 'cosmic-alert-popup';
    toast.innerHTML = `
      <div class="alert-popup-top">
        <div class="alert-icon-wrap">${event.icon}</div>
        <div class="alert-header-text">
          <span class="alert-tag">CELESTIAL EVENT ALERT</span>
          <h4>${event.title}</h4>
        </div>
        <button class="alert-close-btn">&times;</button>
      </div>
      <p class="alert-popup-desc">
        Visible in <strong>${locationName}</strong> on <strong>${event.displayDate}</strong> at <strong>${event.time.split('/')[0].trim()}</strong>.
      </p>
      <div class="alert-popup-actions">
        <button class="btn-primary-sm btn-gcal-sync" data-id="${event.id}">
          <span>📅</span> Sync Google Calendar
        </button>
        <button class="btn-glass-sm btn-ics-download" data-id="${event.id}">
          <span>↓</span> Download .ics
        </button>
      </div>
    `;

    toast.querySelector('.alert-close-btn').addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    });

    toast.querySelector('.btn-gcal-sync').addEventListener('click', () => {
      const gcalUrl = this.createGoogleCalendarLink(event, locationName);
      window.open(gcalUrl, '_blank');
      window.app.showToast('Opened Google Calendar sync!');
    });

    toast.querySelector('.btn-ics-download').addEventListener('click', () => {
      this.downloadIcsFile(event, locationName);
    });

    const container = document.getElementById('toast-container');
    if (container) container.appendChild(toast);
  }
}

window.NotificationEngine = NotificationEngine;
