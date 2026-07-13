(() => {
  "use strict";

  const config = window.NAGAIZUMI_AI_CONFIG || {};
  const questions = [
    {
      title: "今いちばん改善したいのはどちらですか？",
      answers: [
        { label: "売上・集客・提案を伸ばしたい", value: "sales" },
        { label: "業務時間・事務負担・整理の手間を減らしたい", value: "time" }
      ]
    },
    {
      title: "今、特に詰まっている作業はどちらですか？",
      answers: [
        { label: "チラシ、SNS、メール、営業資料など外向けの発信", value: "outbound" },
        { label: "情報整理、事務作業、社内資料、判断材料の整理", value: "organizing" }
      ]
    },
    {
      title: "AIにまず手伝ってほしいのはどちらですか？",
      answers: [
        { label: "すぐ使える文章・資料・定型作業を作ること", value: "create" },
        { label: "課題、優先順位、次にやることを整理すること", value: "clarify" }
      ]
    }
  ];

  const resultMap = {
    "sales|outbound|create": "promotion",
    "sales|outbound|clarify": "salesOpportunity",
    "sales|organizing|create": "salesOpportunity",
    "sales|organizing|clarify": "decision",
    "time|outbound|create": "promotion",
    "time|outbound|clarify": "decision",
    "time|organizing|create": "workflow",
    "time|organizing|clarify": "workflow"
  };

  const results = {
    salesOpportunity: {
      title: "売上機会発見型",
      summary: "AIで文章を作る前に、顧客の困りごと、提案の切り口、既存商品の見せ方を整理すると効果が出やすいタイプです。",
      candidates: ["既存商品・サービスの強み整理", "顧客の悩みや質問の洗い出し", "提案書や営業トークのたたき台"]
    },
    promotion: {
      title: "販促・発信型",
      summary: "チラシ、SNS、メール、営業資料など、外向けの発信をAIへ任せると効果が出やすいタイプです。",
      candidates: ["チラシや案内文のたたき台", "SNS投稿やメール文面", "商品説明、FAQ、営業資料の整理"]
    },
    workflow: {
      title: "業務整理・時短型",
      summary: "日々の繰り返し業務や事務処理を整理し、定型部分をAIへ任せると効果が出やすいタイプです。",
      candidates: ["問い合わせ返信や定型文", "議事録、メモ、報告文の整理", "社内資料、手順書、チェックリスト"]
    },
    decision: {
      title: "経営判断・情報整理型",
      summary: "すぐに文章を作るより、課題、選択肢、優先順位をAIと整理すると効果が出やすいタイプです。",
      candidates: ["課題の棚卸しと優先順位づけ", "選択肢の比較表", "事業計画、振り返り、会議前の論点整理"]
    }
  };

  const state = { questionIndex: 0, answers: [], selectedDate: "20260819" };
  const root = document.querySelector("[data-diagnosis]");
  const status = document.querySelector("[data-diagnosis-status]");
  const progress = document.querySelector("[data-progress]");
  const questionView = document.querySelector("[data-question-view]");
  const resultView = document.querySelector("[data-result-view]");
  const questionNumber = document.querySelector("[data-question-number]");
  const questionTitle = document.querySelector("[data-question-title]");
  const answerList = document.querySelector("[data-answer-list]");
  const resultTitle = document.querySelector("[data-result-title]");
  const resultSummary = document.querySelector("[data-result-summary]");
  const resultCandidates = document.querySelector("[data-result-candidates]");
  const toast = document.querySelector("[data-toast]");

  function track(eventName, parameters = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, parameters);
    }
    window.dispatchEvent(new CustomEvent("nagaizumi:track", { detail: { eventName, parameters } }));
  }

  function renderQuestion() {
    const question = questions[state.questionIndex];
    const displayIndex = state.questionIndex + 1;
    status.textContent = `質問 ${displayIndex} / ${questions.length}`;
    progress.style.width = `${(displayIndex / questions.length) * 100}%`;
    questionNumber.textContent = `QUESTION 0${displayIndex}`;
    questionTitle.textContent = question.title;
    answerList.replaceChildren();

    question.answers.forEach((answer, answerIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.innerHTML = `<span>${answerIndex === 0 ? "A" : "B"}</span><strong>${answer.label}</strong>`;
      button.addEventListener("click", () => chooseAnswer(answer.value));
      answerList.appendChild(button);
    });
  }

  function chooseAnswer(value) {
    state.answers[state.questionIndex] = value;
    if (state.questionIndex === 0) track("diagnosis_start");

    if (state.questionIndex < questions.length - 1) {
      state.questionIndex += 1;
      renderQuestion();
      return;
    }

    showResult();
  }

  function showResult() {
    const typeKey = resultMap[state.answers.join("|")];
    const result = results[typeKey];
    if (!result) return;

    questionView.hidden = true;
    resultView.hidden = false;
    status.textContent = "診断結果";
    progress.style.width = "100%";
    resultTitle.textContent = result.title;
    resultSummary.textContent = result.summary;
    resultCandidates.replaceChildren();
    result.candidates.forEach((candidate) => {
      const item = document.createElement("li");
      item.textContent = candidate;
      resultCandidates.appendChild(item);
    });
    root.dataset.resultType = typeKey;
    track("diagnosis_complete", { diagnosis_type: typeKey });
  }

  function restartDiagnosis() {
    state.questionIndex = 0;
    state.answers = [];
    resultView.hidden = true;
    questionView.hidden = false;
    delete root.dataset.resultType;
    renderQuestion();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3600);
  }

  function openLeadForm() {
    track("lead_cta_click", { diagnosis_type: root.dataset.resultType || "unknown" });
    if (config.leadFormUrl) {
      window.location.href = config.leadFormUrl;
      return;
    }
    showToast("詳しい結果の登録フォームは、UTAGE接続後に利用できます。");
  }

  function selectDate(dateKey) {
    state.selectedDate = dateKey;
    document.querySelectorAll("[data-date-select]").forEach((button) => {
      const selected = button.dataset.dateSelect === dateKey;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const labels = {
      "20260819": "8月19日（水）13:30から15:30",
      "20260830": "8月30日（日）18:00から20:00"
    };
    document.querySelector("[data-selected-date-label]").textContent = labels[dateKey];
    track("date_select", { event_date: dateKey });
  }

  function openPurchase(plan) {
    const dateKey = state.selectedDate;
    const url = config.purchaseUrls?.[dateKey]?.[plan];
    track("checkout_start", { event_date: dateKey, participation_plan: plan });
    if (url) {
      window.location.href = url;
      return;
    }
    showToast("申込ページは、UTAGEの商品URL接続後に利用できます。");
  }

  function setupMenu() {
    const button = document.querySelector("[data-menu-button]");
    const menu = document.querySelector("[data-mobile-nav]");
    if (!button || !menu) return;
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.setAttribute("aria-label", open ? "メニューを開く" : "メニューを閉じる");
      menu.hidden = open;
    });
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "メニューを開く");
        menu.hidden = true;
      });
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  document.querySelector("[data-restart]")?.addEventListener("click", restartDiagnosis);
  document.querySelector("[data-lead-cta]")?.addEventListener("click", openLeadForm);
  document.querySelectorAll("[data-date-select]").forEach((button) => {
    button.addEventListener("click", () => selectDate(button.dataset.dateSelect));
  });
  document.querySelectorAll("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => openPurchase(button.dataset.plan));
  });

  setupMenu();
  setupReveal();
  renderQuestion();
  track("lp_view", { source: new URLSearchParams(window.location.search).get("utm_source") || "direct" });
})();
