(function () {
    const DEFAULT_LIMIT = 12;
    const SELECT_COLUMNS = "id,name,message,page,tag,created_at";

    function getConfig() {
        const config = window.DOLO_GUESTBOOK_CONFIG || {};
        return {
            supabaseUrl: (config.supabaseUrl || "").replace(/\/$/, ""),
            supabaseAnonKey: config.supabaseAnonKey || "",
            table: config.table || "guestbook_messages",
            limit: Number(config.limit || DEFAULT_LIMIT)
        };
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[char]));
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat("zh-CN", {
            month: "short",
            day: "numeric"
        }).format(date);
    }

    function getInitial(name) {
        const trimmed = String(name || "访客").trim();
        return trimmed.charAt(0).toUpperCase() || "D";
    }

    function setStatus(root, message, tone) {
        const status = root.querySelector("[data-guestbook-status]");
        if (!status) return;
        status.textContent = message || "";
        status.dataset.tone = tone || "neutral";
    }

    function setFormEnabled(root, enabled) {
        root.querySelectorAll("[data-guestbook-form] input, [data-guestbook-form] textarea, [data-guestbook-form] button").forEach((field) => {
            field.disabled = !enabled;
        });
    }

    function renderMessages(root, messages) {
        const list = root.querySelector("[data-guestbook-list]");
        if (!list) return;

        if (!messages.length) {
            list.innerHTML = `
                <article class="guestbook-empty">
                    <span>还没有公开留言</span>
                    <strong>欢迎留下第一条真实反馈。</strong>
                </article>
            `;
            return;
        }

        list.innerHTML = messages.map((item) => `
            <article class="guestbook-card">
                <div class="guestbook-card-head">
                    <span class="guestbook-avatar" aria-hidden="true">${escapeHtml(getInitial(item.name))}</span>
                    <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <time datetime="${escapeHtml(item.created_at || "")}">${escapeHtml(formatDate(item.created_at))}</time>
                    </div>
                </div>
                <p>${escapeHtml(item.message)}</p>
            </article>
        `).join("");
    }

    async function requestSupabase(path, options) {
        const config = getConfig();
        const url = `${config.supabaseUrl}/rest/v1/${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                apikey: config.supabaseAnonKey,
                Authorization: `Bearer ${config.supabaseAnonKey}`,
                "Content-Type": "application/json",
                ...(options && options.headers ? options.headers : {})
            }
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(body || `Supabase request failed: ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
    }

    async function loadMessages(root) {
        const config = getConfig();
        const list = root.querySelector("[data-guestbook-list]");
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            root.dataset.ready = "false";
            setFormEnabled(root, false);
            if (list) {
                list.innerHTML = `
                    <article class="guestbook-empty">
                        <span>留言墙即将开放</span>
                        <strong>这里会展示读者留下的公开反馈。</strong>
                    </article>
                `;
            }
            setStatus(root, "留言功能正在连接中，暂时还不能提交。", "neutral");
            return;
        }

        root.dataset.ready = "true";
        setFormEnabled(root, true);
        setStatus(root, "正在读取留言...", "neutral");
        const query = `${config.table}?select=${SELECT_COLUMNS}&status=eq.visible&order=created_at.desc&limit=${config.limit}`;
        const messages = await requestSupabase(query, { method: "GET" });
        renderMessages(root, Array.isArray(messages) ? messages : []);
        setStatus(root, "", "neutral");
    }

    async function submitMessage(root, form) {
        const config = getConfig();
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            setStatus(root, "留言功能还在配置中，暂时不能提交。", "error");
            return;
        }

        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const page = root.dataset.guestbookPage || location.pathname || "homepage";

        if (name.length < 1 || name.length > 40) {
            setStatus(root, "名字请控制在 1-40 个字符。", "error");
            return;
        }

        if (message.length < 2 || message.length > 500) {
            setStatus(root, "留言请控制在 2-500 个字符。", "error");
            return;
        }

        const button = form.querySelector("button[type='submit']");
        if (button) button.disabled = true;
        setStatus(root, "正在提交...", "neutral");

        try {
            await requestSupabase(config.table, {
                method: "POST",
                headers: { Prefer: "return=minimal" },
                body: JSON.stringify({ name, message, page, status: "visible" })
            });
            form.reset();
            setStatus(root, "已发布，谢谢你留下这一句。", "success");
            await loadMessages(root);
        } finally {
            if (button) button.disabled = false;
        }
    }

    function initGuestbook(root) {
        const form = root.querySelector("[data-guestbook-form]");
        if (form) {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                submitMessage(root, form).catch((error) => {
                    console.error(error);
                    setStatus(root, "提交失败，稍后再试。", "error");
                });
            });
        }

        loadMessages(root).catch((error) => {
            console.error(error);
            setStatus(root, "留言读取失败，稍后刷新再试。", "error");
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-guestbook]").forEach(initGuestbook);
    });
}());
