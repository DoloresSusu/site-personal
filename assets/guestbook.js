(function () {
    const DEFAULT_LIMIT = 12;
    const SUBMIT_COOLDOWN_MS = 10000;
    const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
    const SELECT_COLUMNS = "id,name,message,page,tag,created_at";
    const I18N = {
        zh: {
            locale: "zh-CN",
            cooldown: "刚刚已经提交过啦，{seconds} 秒后再试。",
            duplicate: "这条留言已经提交过啦，换一句再发。",
            cooldownButton: "{seconds} 秒后可再提交",
            empty: "还没有公开留言",
            emptyDetail: "欢迎留下第一条真实反馈。",
            comingSoon: "留言墙即将开放",
            comingSoonDetail: "这里会展示读者留下的公开反馈。",
            unavailable: "留言功能正在连接中，暂时还不能提交。",
            loading: "正在读取留言...",
            notConfigured: "留言功能还在配置中，暂时不能提交。",
            invalidName: "名字请控制在 1-40 个字符。",
            invalidMessage: "留言请控制在 2-500 个字符。",
            submitting: "正在提交...",
            success: "已发布，谢谢你留下这一句。",
            submitFailed: "提交失败，稍后再试。",
            loadFailed: "留言读取失败，稍后刷新再试。"
        },
        en: {
            locale: "en-US",
            cooldown: "You just posted. Try again in {seconds} seconds.",
            duplicate: "That message has already been posted. Try a different note.",
            cooldownButton: "Try again in {seconds}s",
            empty: "No public messages yet",
            emptyDetail: "Be the first to leave a genuine note.",
            comingSoon: "The guestbook is coming soon",
            comingSoonDetail: "Public messages from readers will appear here.",
            unavailable: "The guestbook is still connecting and cannot accept messages yet.",
            loading: "Loading messages...",
            notConfigured: "The guestbook is not ready to accept messages yet.",
            invalidName: "Please keep your name between 1 and 40 characters.",
            invalidMessage: "Please keep your message between 2 and 500 characters.",
            submitting: "Posting...",
            success: "Published. Thank you for leaving a note.",
            submitFailed: "Could not post your message. Please try again later.",
            loadFailed: "Could not load messages. Please refresh and try again."
        },
        es: {
            locale: "es-ES",
            cooldown: "Acabas de publicar. Inténtalo de nuevo en {seconds} segundos.",
            duplicate: "Ese mensaje ya se ha publicado. Escribe algo diferente.",
            cooldownButton: "Reintentar en {seconds}s",
            empty: "Aún no hay mensajes públicos",
            emptyDetail: "Sé la primera persona en dejar un mensaje.",
            comingSoon: "El libro de visitas estará disponible pronto",
            comingSoonDetail: "Aquí aparecerán los mensajes públicos.",
            unavailable: "El libro de visitas todavía se está conectando.",
            loading: "Cargando mensajes...",
            notConfigured: "El libro de visitas aún no acepta mensajes.",
            invalidName: "El nombre debe tener entre 1 y 40 caracteres.",
            invalidMessage: "El mensaje debe tener entre 2 y 500 caracteres.",
            submitting: "Publicando...",
            success: "Publicado. Gracias por dejar un mensaje.",
            submitFailed: "No se pudo publicar. Inténtalo más tarde.",
            loadFailed: "No se pudieron cargar los mensajes. Actualiza la página."
        },
        pt: {
            locale: "pt-BR",
            cooldown: "Você acabou de publicar. Tente novamente em {seconds} segundos.",
            duplicate: "Essa mensagem já foi publicada. Escreva algo diferente.",
            cooldownButton: "Tente em {seconds}s",
            empty: "Ainda não há mensagens públicas",
            emptyDetail: "Seja a primeira pessoa a deixar uma mensagem.",
            comingSoon: "O livro de visitas estará disponível em breve",
            comingSoonDetail: "As mensagens públicas aparecerão aqui.",
            unavailable: "O livro de visitas ainda está sendo conectado.",
            loading: "Carregando mensagens...",
            notConfigured: "O livro de visitas ainda não aceita mensagens.",
            invalidName: "O nome deve ter entre 1 e 40 caracteres.",
            invalidMessage: "A mensagem deve ter entre 2 e 500 caracteres.",
            submitting: "Publicando...",
            success: "Publicado. Obrigada por deixar uma mensagem.",
            submitFailed: "Não foi possível publicar. Tente novamente mais tarde.",
            loadFailed: "Não foi possível carregar as mensagens. Atualize a página."
        },
        fr: {
            locale: "fr-FR",
            cooldown: "Vous venez de publier. Réessayez dans {seconds} secondes.",
            duplicate: "Ce message a déjà été publié. Écrivez-en un autre.",
            cooldownButton: "Réessayer dans {seconds}s",
            empty: "Aucun message public pour le moment",
            emptyDetail: "Soyez la première personne à laisser un mot.",
            comingSoon: "Le livre d’or sera bientôt disponible",
            comingSoonDetail: "Les messages publics apparaîtront ici.",
            unavailable: "Le livre d’or est encore en cours de connexion.",
            loading: "Chargement des messages...",
            notConfigured: "Le livre d’or ne peut pas encore recevoir de messages.",
            invalidName: "Le nom doit contenir entre 1 et 40 caractères.",
            invalidMessage: "Le message doit contenir entre 2 et 500 caractères.",
            submitting: "Publication...",
            success: "Publié. Merci d’avoir laissé un mot.",
            submitFailed: "Impossible de publier. Réessayez plus tard.",
            loadFailed: "Impossible de charger les messages. Actualisez la page."
        }
    };

    function getLanguage(root) {
        const requested = root && root.dataset.guestbookLocale;
        return I18N[requested] ? requested : "zh";
    }

    function translate(root, key, values) {
        let message = I18N[getLanguage(root)][key] || I18N.zh[key] || "";
        Object.entries(values || {}).forEach(([name, value]) => {
            message = message.replace(`{${name}}`, value);
        });
        return message;
    }

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

    function formatDate(root, value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat(I18N[getLanguage(root)].locale, {
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

    function getStorageKey(root) {
        return `dolo_guestbook_recent_submit:${root.dataset.guestbookPage || location.pathname || "homepage"}`;
    }

    function readRecentSubmit(root) {
        try {
            return JSON.parse(localStorage.getItem(getStorageKey(root)) || "{}");
        } catch {
            return {};
        }
    }

    function rememberSubmit(root, signature) {
        try {
            localStorage.setItem(getStorageKey(root), JSON.stringify({
                signature,
                timestamp: Date.now()
            }));
        } catch {
            // Storage can be unavailable in strict privacy modes. The server insert still works.
        }
    }

    function getDuplicateWarning(root, signature) {
        const recent = readRecentSubmit(root);
        const elapsed = Date.now() - Number(recent.timestamp || 0);

        if (elapsed >= 0 && elapsed < SUBMIT_COOLDOWN_MS) {
            const seconds = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000);
            return translate(root, "cooldown", { seconds });
        }

        if (recent.signature === signature && elapsed >= 0 && elapsed < DUPLICATE_WINDOW_MS) {
            return translate(root, "duplicate");
        }

        return "";
    }

    function makeSignature(page, name, message) {
        return [page, name, message]
            .map((item) => String(item || "").trim().replace(/\s+/g, " ").toLowerCase())
            .join("|");
    }

    function startSubmitCooldown(root, button) {
        if (!button) return;
        const originalText = button.dataset.originalText || button.textContent;
        button.dataset.originalText = originalText;
        button.disabled = true;

        let remaining = Math.ceil(SUBMIT_COOLDOWN_MS / 1000);
        button.textContent = translate(root, "cooldownButton", { seconds: remaining });

        const timer = window.setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
                button.textContent = translate(root, "cooldownButton", { seconds: remaining });
                return;
            }

            window.clearInterval(timer);
            button.textContent = originalText;
            button.disabled = false;
        }, 1000);
    }

    function renderMessages(root, messages) {
        const list = root.querySelector("[data-guestbook-list]");
        if (!list) return;

        if (!messages.length) {
            list.innerHTML = `
                <article class="guestbook-empty">
                    <span>${escapeHtml(translate(root, "empty"))}</span>
                    <strong>${escapeHtml(translate(root, "emptyDetail"))}</strong>
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
                        <time datetime="${escapeHtml(item.created_at || "")}">${escapeHtml(formatDate(root, item.created_at))}</time>
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

        const body = await response.text();

        if (!response.ok) {
            throw new Error(body || `Supabase request failed: ${response.status}`);
        }

        if (!body) return null;
        return JSON.parse(body);
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
                        <span>${escapeHtml(translate(root, "comingSoon"))}</span>
                        <strong>${escapeHtml(translate(root, "comingSoonDetail"))}</strong>
                    </article>
                `;
            }
            setStatus(root, translate(root, "unavailable"), "neutral");
            return;
        }

        root.dataset.ready = "true";
        setFormEnabled(root, true);
        setStatus(root, translate(root, "loading"), "neutral");
        const query = `${config.table}?select=${SELECT_COLUMNS}&status=eq.visible&order=created_at.desc&limit=${config.limit}`;
        const messages = await requestSupabase(query, { method: "GET" });
        renderMessages(root, Array.isArray(messages) ? messages : []);
        setStatus(root, "", "neutral");
    }

    async function submitMessage(root, form) {
        const config = getConfig();
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            setStatus(root, translate(root, "notConfigured"), "error");
            return;
        }

        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const page = root.dataset.guestbookPage || location.pathname || "homepage";
        const signature = makeSignature(page, name, message);

        if (name.length < 1 || name.length > 40) {
            setStatus(root, translate(root, "invalidName"), "error");
            return;
        }

        if (message.length < 2 || message.length > 500) {
            setStatus(root, translate(root, "invalidMessage"), "error");
            return;
        }

        const duplicateWarning = getDuplicateWarning(root, signature);
        if (duplicateWarning) {
            setStatus(root, duplicateWarning, "error");
            return;
        }

        const button = form.querySelector("button[type='submit']");
        let keepButtonDisabled = false;
        if (button) button.disabled = true;
        setStatus(root, translate(root, "submitting"), "neutral");

        try {
            await requestSupabase(config.table, {
                method: "POST",
                headers: { Prefer: "return=minimal" },
                body: JSON.stringify({ name, message, page, status: "visible" })
            });
            rememberSubmit(root, signature);
            form.reset();
            await loadMessages(root);
            setStatus(root, translate(root, "success"), "success");
            keepButtonDisabled = true;
            startSubmitCooldown(root, button);
        } finally {
            if (button && !keepButtonDisabled) button.disabled = false;
        }
    }

    function initGuestbook(root) {
        const form = root.querySelector("[data-guestbook-form]");
        if (form) {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                submitMessage(root, form).catch((error) => {
                    console.error(error);
                    setStatus(root, translate(root, "submitFailed"), "error");
                });
            });
        }

        loadMessages(root).catch((error) => {
            console.error(error);
            setStatus(root, translate(root, "loadFailed"), "error");
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-guestbook]").forEach(initGuestbook);
    });
}());
