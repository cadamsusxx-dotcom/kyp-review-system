(function() {
  const SURVEY_BASE = 'https://kyp-review-system.onrender.com/survey';

  function buildUrl(overall, dimPct, mode) {
    try { return SURVEY_BASE + '?kyp=' + btoa(JSON.stringify({overall,dimPct,mode})); }
    catch(e) { return SURVEY_BASE; }
  }

  function makeButton(url) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin:0 24px 16px;background:linear-gradient(135deg,#1a2744,#243860);border-radius:16px;padding:24px;color:#fff;text-align:center';
    wrap.innerHTML = `
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5dd6c8;font-weight:500;margin-bottom:8px">Clinical Advisory Program</div>
      <div style="font-family:'Playfair Display',serif;font-size:19px;margin-bottom:8px">Are you a clinical professional?</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.65;margin-bottom:18px;max-width:400px;margin-left:auto;margin-right:auto">Share your expert assessment of this app. Your KYP scores will be included automatically — no re-entry needed.</div>
      <a href="${url}" style="display:inline-block;background:#0d7a6e;color:#fff;text-decoration:none;padding:13px 30px;border-radius:10px;font-size:14px;font-weight:500;font-family:'DM Sans',sans-serif">Take the Clinical Review Survey →</a>`;
    return wrap;
  }

  function insertBefore(targetEl, node) {
    targetEl.parentNode.insertBefore(node, targetEl);
  }

  // Watch for results pages becoming active
  const observer = new MutationObserver(function() {
    // Solo results
    const soloPage = document.getElementById('page-results');
    if (soloPage && soloPage.classList.contains('active') && !soloPage.dataset.surveyInjected) {
      const restartWrap = soloPage.querySelector('.restart-wrap');
      if (restartWrap) {
        // Try to grab overall score from rendered DOM
        const scoreEl = soloPage.querySelector('.score-number');
        const overall = scoreEl ? parseInt(scoreEl.textContent) : 0;
        // Get dim scores from bar fills
        const dimPct = {};
        const dimKeys = ['loveMap','conflict','attunement','sharedMeaning','positivity'];
        soloPage.querySelectorAll('.dim-bar-fill').forEach((el, i) => {
          if (i < dimKeys.length) dimPct[dimKeys[i]] = parseInt(el.style.width) || 0;
        });
        insertBefore(restartWrap, makeButton(buildUrl(overall, dimPct, 'solo')));
        soloPage.dataset.surveyInjected = '1';
      }
    }

    // Couple results
    const couplePage = document.getElementById('page-couple-results');
    if (couplePage && couplePage.classList.contains('active') && !couplePage.dataset.surveyInjected) {
      const restartWrap = couplePage.querySelector('.restart-wrap');
      if (restartWrap) {
        const scoreEls = couplePage.querySelectorAll('.ov-num');
        const overall = scoreEls.length >= 2
          ? Math.round((parseInt(scoreEls[0].textContent) + parseInt(scoreEls[1].textContent)) / 2)
          : 0;
        const dimPct = {};
        const dimKeys = ['loveMap','conflict','attunement','sharedMeaning','positivity'];
        // Average both partners' bar fills
        const allBars = [...couplePage.querySelectorAll('.cbar-fill-a')];
        const bBars  = [...couplePage.querySelectorAll('.cbar-fill-b')];
        allBars.forEach((el, i) => {
          if (i < dimKeys.length) {
            const a = parseInt(el.style.width) || 0;
            const b = bBars[i] ? parseInt(bBars[i].style.width) || 0 : a;
            dimPct[dimKeys[i]] = Math.round((a + b) / 2);
          }
        });
        insertBefore(restartWrap, makeButton(buildUrl(overall, dimPct, 'couple')));
        couplePage.dataset.surveyInjected = '1';
      }
    }
  });

  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
})();
