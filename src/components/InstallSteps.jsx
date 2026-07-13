/* "Add to your phone" instructions body. TellyLog is an installable PWA
   (manifest + icons + offline shell, v2.7.0), so "Add to Home Screen" gives
   a real app icon that opens full screen. This only shows the steps; the
   browser and OS do the install. Rendered inline inside the Profile ADD TO
   YOUR PHONE section, expanded in place: opt-in from Profile, or already
   expanded when arriving from the tag on the Shows and Films tabs. */
import React from 'react';

export default function InstallSteps() {
  return (
    <div className="install">
      <p className="install__intro">Install it like an app: a home-screen icon that opens full screen with no browser bar. It still runs entirely on your device, nothing is uploaded.</p>

      <div className="install__block">
        <h3 className="install__head">iPhone or iPad (Safari)</h3>
        <ol className="install__steps">
          <li>Open <strong>tellylog-3d2u.vercel.app</strong> in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> button, the square with an arrow pointing up.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> in the top corner. The icon lands on your home screen.</li>
        </ol>
      </div>

      <div className="install__block">
        <h3 className="install__head">Android (Chrome)</h3>
        <ol className="install__steps">
          <li>Open <strong>tellylog-3d2u.vercel.app</strong> in <strong>Chrome</strong>.</li>
          <li>Tap the <strong>⋮</strong> menu, three dots in the top right.</li>
          <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
          <li>Tap <strong>Add</strong> or <strong>Install</strong> to confirm.</li>
        </ol>
      </div>

      <p className="fineprint">Cannot see the option? Open the site directly in Safari (iPhone) or Chrome (Android), not inside another app like Instagram or WhatsApp, where the menu is hidden.</p>
    </div>
  );
}
