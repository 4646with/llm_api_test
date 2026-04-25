const curlInput = document.getElementById('curlInput');
const sendBtn = document.getElementById('sendBtn');
const jsonOutput = document.getElementById('jsonOutput');
const resultContainer = document.getElementById('resultContainer');
const loader = document.getElementById('loader');
const presetGen = document.getElementById('presetGen');
const uiKey = document.getElementById('uiKey');
const uiModel = document.getElementById('uiModel');
const uiEndpoint = document.getElementById('uiEndpoint');

// 实时响应 UI 控件，动态修改代码框的 cURL
function syncUIToCurl() {
    let code = curlInput.value;
    if (!code) return;

    // 同步 Key
    const keyVal = uiKey.value.trim();
    if (keyVal) {
        code = code.replace(/Bearer\s+[a-zA-Z0-9\-_]+/, `Bearer ${keyVal}`);
        code = code.replace(/Bearer\s+sk-请在此替换为您的密钥/, `Bearer ${keyVal}`);
    }

    // 同步 Endpoint
    const targetUrl = uiEndpoint.value;
    if (targetUrl) {
         code = code.replace(/(curl\s+-X\s+[A-Z]+\s+["'])https?:\/\/[^"'\s]+/, `$1${targetUrl}`);
    }

    // 同步 Model (自定义输入)
    const modelVal = uiModel.value.trim();
    if (modelVal) {
        code = code.replace(/("model"\s*:\s*)"[^"]+"/, `$1"${modelVal}"`);
        code = code.replace(/('model'\s*:\s*)'[^']+'/, `$1'${modelVal}'`);
    }

    curlInput.value = code;
}

[uiKey, uiModel, uiEndpoint].forEach(el => {
    el.addEventListener('input', syncUIToCurl);
    el.addEventListener('change', syncUIToCurl);
});
uiKey.addEventListener('blur', syncUIToCurl);
uiModel.addEventListener('blur', syncUIToCurl);

const uiMode = document.getElementById('uiMode');

// 一键生成模板逻辑
presetGen.addEventListener('click', () => {
    const endpoint = uiEndpoint.value || "https://pinova.ai/v1/chat/completions";
    const mode = uiMode.value; // 'chat' or 'image'
    
    let fallbackModel = 'gpt-4o';
    if (mode === 'image') {
        fallbackModel = endpoint.includes('pinova') ? 'gpt-image-2-pro' : 'gpt-image-2';
    }
    const model = uiModel.value.trim() || fallbackModel;
    const existingKey = uiKey.value.trim() || "sk-请在此替换为您的密钥";

    let generatedCurl = '';

    if (mode === 'chat') {
        generatedCurl = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${existingKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {
        "role": "system", 
        "content": "You are a helpful assistant." 
      },
      {
        "role": "user",
        "content": "你好世界！"
      }
    ],
    "temperature": 0.7
  }'`;
    } else if (mode === 'image') {
        generatedCurl = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${existingKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "prompt": "一杯放在靠窗原木桌上的热拿铁，清晨的阳光穿透玻璃洒在杯沿，4K画质，极致细节，电影感光影",
    "size": "3840x2160",
    "n": 1
  }'`;
    }

    if (generatedCurl) {
        curlInput.value = generatedCurl;
    }
});

// Core cURL parser
function parseCurl(cmdString) {
    if (!cmdString.trim().startsWith("curl")) {
        throw new Error("格式异常: 指令必须以 'curl' 开头。");
    }

    const request = {
        method: 'GET',
        headers: {},
        body: null,
        url: ''
    };

    const str = cmdString.trim();

    // 1. 提取 URL
    // 支持模式: curl "URL", curl 'URL', curl URL, 或者 curl -X GET URL 等
    const urlRegex = /curl(?:\s+-X\s+[A-Z]+)?\s+(?:"([^"]+)"|'([^']+)'|([^\s']+))/i;
    const urlMatch = str.match(urlRegex);
    if (!urlMatch) {
        throw new Error("解析失败: 无法从命令中识别到合法的目标 URL。");
    }
    request.url = urlMatch[1] || urlMatch[2] || urlMatch[3];

    // 2. 提取 HTTP Method
    const methodMatch = str.match(/-X\s+([A-Z]+)/);
    if (methodMatch) {
        request.method = methodMatch[1];
    }

    // 3. 提取 Headers
    const headerRegex = /-H\s+(?:"([^"]+)"|'([^']+)')/g;
    let match;
    while ((match = headerRegex.exec(str)) !== null) {
        const headerStr = match[1] || match[2];
        const splitIdx = headerStr.indexOf(':');
        if (splitIdx > -1) {
            const key = headerStr.substring(0, splitIdx).trim();
            const val = headerStr.substring(splitIdx + 1).trim();
            request.headers[key] = val;
        }
    }

    // 4. 提取 Body 参数 (兼容 JSON 嵌套处理)
    // 捕获紧跟在 -d 或 --data 后面用引号包裹或被括号包裹的内容
    const dataRegex = /(?:-d|--data|--data-raw)\s+((?:'[^']*')|(?:"(?:\\.|[^"])*")|(?:\{[\s\S]*\}))/;
    const dataMatch = str.match(dataRegex);

    if (dataMatch) {
        let bodyRaw = dataMatch[1].trim();

        // 斩去外层包裹的各种可能引号
        if (bodyRaw.startsWith("'") && bodyRaw.endsWith("'")) {
            bodyRaw = bodyRaw.slice(1, -1);
        } else if (bodyRaw.startsWith('"') && bodyRaw.endsWith('"')) {
            // 如果是最外层双引号，内部通常被进行了 \" 转义，需要翻转回来
            bodyRaw = bodyRaw.slice(1, -1).replace(/\\"/g, '"');
        }

        request.body = bodyRaw;
        // 如果提取到了 Body，且并未显式指定方法，则在 Restful 中通常默认为 POST
        if (!methodMatch) {
            request.method = 'POST';
        }
    }

    return request;
}

// 事件绑定
sendBtn.addEventListener('click', async () => {
    const rawCurl = curlInput.value.trim();
    if (!rawCurl) {
        renderOutput("请先粘贴 cURL 请求命令！");
        return;
    }

    try {
        loader.classList.remove('hidden');
        renderOutput("解析并建立连接中...");

        const parsedReq = parseCurl(rawCurl);
        
        // 发起抓取请求
        const fetchOptions = {
            method: parsedReq.method,
            headers: parsedReq.headers
        };

        if (parsedReq.body && parsedReq.method !== 'GET') {
            fetchOptions.body = parsedReq.body;
        }

        const res = await fetch(parsedReq.url, fetchOptions);
        
        // 根据状态预分流，尝试转换内容
        let responseData;
        const resText = await res.text();
        try {
            responseData = JSON.parse(resText);
        } catch (e) {
            // 非 JSON 数据
            responseData = resText;
        }

        if (!res.ok) {
            throw new Error(`[HTTP ${res.status}] ${JSON.stringify(responseData, null, 2)}`);
        }

        // 为了防止 base64 过长导致浏览器卡顿崩溃，在输出 JSON 文本前将其截断
        // 使用深拷贝保护原始数据给后续渲染层使用
        let displayData = JSON.parse(JSON.stringify(responseData));
        if (displayData.data && Array.isArray(displayData.data)) {
            displayData.data = displayData.data.map(item => {
                if (item.b64_json) {
                    return { ...item, b64_json: `[Base64 长字符串已隐藏... 长度: ${item.b64_json.length} 字符. 原图已在上侧渲染]` };
                }
                return item;
            });
        }
        
        if (displayData.choices && Array.isArray(displayData.choices)) {
            displayData.choices.forEach(choice => {
                if (choice.message && typeof choice.message.content === 'string') {
                    // 防止内嵌在 Markdown 文本里的超长 data:image base64 图卡死底部的 JSON 接口调试框
                    choice.message.content = choice.message.content.replace(/(data:image\/[^;]+;base64,)[A-Za-z0-9+/=]{100,}/g, '$1[BASE64_STRING_TRUNCATED_TO_SAVE_MEMORY...]');
                }
            });
        }
        
        const rawJsonStr = JSON.stringify(displayData, null, 2);

        // 成功后的显示层分发过滤
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
            // 图库返回结构
            const firstItem = responseData.data[0];
            if (firstItem.url) {
                renderImage(firstItem.url, rawJsonStr);
            } else if (firstItem.b64_json) {
                const dataUrl = `data:image/png;base64,${firstItem.b64_json}`;
                renderImage(dataUrl, rawJsonStr);
            } else {
                renderOutput(rawJsonStr);
            }
        } else if (responseData && responseData.choices && Array.isArray(responseData.choices) && responseData.choices[0].message) {
            // 对话模型返回结构: 提取文本，防止复杂的过滤参数如 content_filter_results 将核心回答刷出屏幕外
            const msgContent = responseData.choices[0].message.content;
            renderTextCompletion(msgContent, rawJsonStr);
        } else {
            renderOutput(rawJsonStr);
        }

    } catch (err) {
        renderOutput(`[解析或连接故障]\n${err.message}`);
    } finally {
        loader.classList.add('hidden');
    }
});

// UI 构建器
function renderOutput(textStr) {
    resultContainer.innerHTML = `<pre><code class="language-json">${escapeHtml(textStr)}</code></pre>`;
}

function parseBasicMarkdown(text) {
    // 优先转移防注入，然后再把 Markdown 特征字符串解析成 HTML 标签
    let html = escapeHtml(text);
    // 解析图片 ![alt](url) 兼容支持 http(s) 以及 data:image base64 图
    html = html.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^\)]+)\)/gi, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:12px 0; display:block; border:1px solid #E4E4E7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">');
    // 解析链接 [text](url)
    html = html.replace(/\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/gi, '<a href="$2" target="_blank" style="color:#2563EB; text-decoration:underline;">$1</a>');
    return html;
}

function renderTextCompletion(textContent, rawJsonStr) {
    const renderedHtml = parseBasicMarkdown(textContent);
    resultContainer.innerHTML = `
        <div class="result-text-wrapper" style="display:flex; flex-direction:column; gap:8px;">
            <span style="font-size:0.8rem; color:#71717A;">提取的人类可读回文 (AI Message)</span>
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; font-size:0.95rem; line-height:1.6; white-space:pre-wrap; word-break:break-all; color:var(--text-main); margin-bottom:12px;">${renderedHtml}</div>
            <div style="font-size:0.85rem; font-weight:600;">原始数据层 (Raw Payload) <span style="font-weight:normal; color:#A1A1AA; font-size:0.75rem;">下面是您截图中看到的附带内容安全审查机制(filter)等的完整 JSON:</span></div>
            <pre><code class="language-json">${escapeHtml(rawJsonStr)}</code></pre>
        </div>
    `;
}

function renderImage(imgUrl, rawJsonStr) {
    resultContainer.innerHTML = `
        <div class="result-image-wrapper">
            <span style="font-size:0.8rem; color:#71717A;">识别到包含图片的响应流 (Image Detected)</span>
            <img src="${escapeHtml(imgUrl)}" alt="API Generated Content">
            <div style="font-size:0.8rem; margin-top:20px; font-weight:600;">原始数据层 (Raw Payload):</div>
            <pre><code class="language-json">${escapeHtml(rawJsonStr)}</code></pre>
        </div>
    `;
}

// 辅助转义方法防止内容中的 HTML 解析异常
function escapeHtml(unsafe) {
    return (unsafe||"").toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
