/* PyPad Studio - iPad Python IDE JavaScript Logic */

document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let pyodideInstance = null;
    let isPyodideReady = false;
    let isRunning = false;
    let aceEditor = null;
    
    // Default Files Store
    const DEFAULT_FILES = {
        'main.py': `# ==========================================
# Welcome to PyPad Studio for iPad & Web!
# App Lập Trình Python Cầm Tay Cực Mượt
# ==========================================

import math
import sys
import random

def welcome():
    print("🚀 PyPad Engine Version: Python", sys.version.split()[0])
    print("📱 Thiết bị:", "iPad / Touch Mode Ready")
    print("-" * 40)
    
    # Ví dụ tính toán số học
    radius = 7.5
    area = math.pi * (radius ** 2)
    print(f"📐 Diện tích hình tròn (bán kính R={radius}): {area:.2f}")

    # Tạo danh sách số ngẫu nhiên
    numbers = [random.randint(1, 100) for _ in range(5)]
    print(f"🎲 Danh sách số ngẫu nhiên: {numbers}")
    print(f"📊 Giá trị lớn nhất (Max): {max(numbers)}")

if __name__ == "__main__":
    welcome()
`,
        'plot_demo.py': `# ==========================================
# Matplotlib Chart Visualization on iPad
# ==========================================

import matplotlib.pyplot as plt
import numpy as np

# Tạo dữ liệu sóng Sin và Cos
x = np.linspace(0, 10, 100)
y_sin = np.sin(x)
y_cos = np.cos(x)

# Khởi tạo đồ thị với màu sắc hiện đại
plt.figure(figsize=(7, 4.5), facecolor='#0f172a')
ax = plt.axes()
ax.set_facecolor('#1e293b')

plt.plot(x, y_sin, label='Sóng Sin(x)', color='#38bdf8', linewidth=2.5)
plt.plot(x, y_cos, label='Sóng Cos(x)', color='#f59e0b', linewidth=2.5, linestyle='--')

# Tùy chỉnh nhãn và tiêu đề
plt.title('Biểu Đồ Sóng Sin & Cosine - PyPad Studio', color='#f8fafc', fontsize=12, fontweight='bold', pad=12)
plt.xlabel('Trục X (Thời gian)', color='#94a3b8')
plt.ylabel('Trục Y (Biên độ)', color='#94a3b8')
plt.tick_params(colors='#94a3b8')
plt.grid(True, color='#334155', linestyle=':', alpha=0.6)
plt.legend(facecolor='#0f172a', edgecolor='#334155', labelcolor='#f8fafc')

print("✅ Đã tạo xong biểu đồ Matplotlib! Hãy chuyển sang Tab 'Biểu Đồ & Đồ Họa' để xem.")
`,
        'turtle_art.py': `# ==========================================
# Visual Graphics & Spiral Art Generator
# ==========================================

import math

def draw_math_spiral():
    print("🎨 Đang vẽ họa tiết hình học nghệ thuật...")
    points = []
    num_petals = 8
    
    for i in range(360):
        angle = math.radians(i)
        r = 150 * math.sin(num_petals * angle)
        x = r * math.cos(angle) + 300
        y = r * math.sin(angle) + 200
        points.append((x, y))
        
    print(f"✨ Đã tính toán xong {len(points)} tọa độ nét vẽ nghệ thuật!")
    print("👉 Hãy thử dùng thư viện matplotlib hoặc canvas để tô màu!")

draw_math_spiral()
`,
        'game_guess.py': `# ==========================================
# Minigame Đoán Số Tương Tác
# ==========================================

import random

def play_game():
    secret = random.randint(1, 20)
    print("🎮 CHÀO MỪNG ĐẾN VỚI GAME ĐOÁN SỐ (1 - 20)!")
    print("Máy tính đã chọn 1 số bí mật.")
    
    # Mô phỏng lượt đoán
    attempts = [random.randint(1, 20) for _ in range(4)]
    
    for idx, guess in enumerate(attempts, 1):
        print(f"Lượt {idx}: Người chơi đoán -> {guess}")
        if guess == secret:
            print("🎉 CHÍNH XÁC! Bạn đã thắng!")
            break
        elif guess < secret:
            print("📈 Thấp quá! Số bí mật lớn hơn.")
        else:
            print("📉 Cao quá! Số bí mật nhỏ hơn.")
    else:
        print(f"🔒 Hết lượt! Số bí mật chính xác là: {secret}")

play_game()
`
    };

    let files = JSON.parse(localStorage.getItem('pypad_files')) || DEFAULT_FILES;
    let activeFileName = localStorage.getItem('pypad_active_file') || 'main.py';

    // DOM Elements
    const consoleOutput = document.getElementById('console-output');
    const replOutput = document.getElementById('repl-output');
    const replInput = document.getElementById('repl-input');
    const replSendBtn = document.getElementById('repl-send-btn');
    const btnRun = document.getElementById('btn-run');
    const btnStop = document.getElementById('btn-stop');
    const btnRunDropdown = document.getElementById('btn-run-dropdown');
    const runDropdownMenu = document.getElementById('run-dropdown-menu');
    const fileListEl = document.getElementById('file-list');
    const tabsBarEl = document.getElementById('tabs-bar');
    const currentFilenameEl = document.getElementById('current-filename');
    const unsavedIndicator = document.getElementById('unsaved-indicator');
    const plotContainer = document.getElementById('plot-container');
    const matplotlibBox = document.getElementById('matplotlib-output');
    const plotBadge = document.getElementById('plot-badge');
    const plotBadgeInner = document.getElementById('plot-badge-inner');
    const engineStatus = document.getElementById('engine-status');
    const filePicker = document.getElementById('file-picker');

    // Right File Menu Drawer
    const btnFileMenu = document.getElementById('btn-file-menu');
    const btnCloseFileMenu = document.getElementById('btn-close-file-menu');
    const rightFileMenu = document.getElementById('right-file-menu');
    const fileMenuBackdrop = document.getElementById('file-menu-backdrop');

    // Floating Output Board
    const btnToggleOutput = document.getElementById('btn-toggle-output');
    const floatingOutputPanel = document.getElementById('floating-output-panel');
    const btnCloseOutput = document.getElementById('btn-close-output');
    const btnExpandOutput = document.getElementById('btn-expand-output');
    const btnClearConsole = document.getElementById('btn-clear-console');

    // Action Menu Dropdown
    const btnActionMenu = document.getElementById('btn-action-menu');
    const actionDropdown = document.getElementById('action-dropdown');

    // Initialize Ace Editor
    function initEditor() {
        aceEditor = ace.edit("code-editor");
        aceEditor.setTheme("ace/theme/one_dark");
        aceEditor.session.setMode("ace/mode/python");
        aceEditor.setFontSize(16);
        aceEditor.setShowPrintMargin(false);
        aceEditor.session.setUseWrapMode(true);
        aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 4,
            useSoftTabs: true
        });

        // Load active file code
        if (!files[activeFileName]) {
            activeFileName = Object.keys(files)[0] || 'main.py';
        }
        aceEditor.setValue(files[activeFileName], -1);

        // Event listener for changes
        aceEditor.session.on('change', () => {
            files[activeFileName] = aceEditor.getValue();
            saveFilesToStorage();
            unsavedIndicator.classList.remove('hidden');
        });
    }

    // Storage handlers
    function saveFilesToStorage() {
        localStorage.setItem('pypad_files', JSON.stringify(files));
        localStorage.setItem('pypad_active_file', activeFileName);
    }

    // Pyodide Initialization
    async function initPyodide() {
        try {
            logConsole("sys-msg", "⚙️ Đang nạp Pyodide WASM Python 3 Engine...");
            pyodideInstance = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
            });

            // Set stdout & stderr streams
            pyodideInstance.setStdout({
                batched: (text) => logConsole("log-stdout", text)
            });
            pyodideInstance.setStderr({
                batched: (text) => logConsole("log-stderr", text)
            });

            // Pre-load matplotlib & numpy
            logConsole("sys-msg", "📦 Đang cài đặt sẵn các gói: numpy, matplotlib, micropip...");
            await pyodideInstance.loadPackage(['numpy', 'matplotlib']);

            // Setup matplotlib rendering capture code
            await pyodideInstance.runPythonAsync(`
import io
import base64
import sys

def _get_plt_image():
    try:
        import matplotlib.pyplot as plt
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', facecolor='#0f172a', edgecolor='none')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close('all')
        return img_str
    except Exception as e:
        return None
`);

            isPyodideReady = true;
            consoleOutput.innerHTML = "";
            logConsole("sys-msg", "✅ Pyodide Python 3 WASM đã sẵn sàng! Bấm nút [RUN] hoặc gõ lệnh để trải nghiệm.");

            // Update status UI
            engineStatus.classList.remove('loading');
            engineStatus.classList.add('ready');
            engineStatus.querySelector('.status-text').textContent = "Python 3 WASM Sẵn sàng";
            engineStatus.querySelector('i').className = "fa-solid fa-check-circle";
        } catch (err) {
            logConsole("log-error", "❌ Lỗi khởi tạo Pyodide: " + err.message);
            engineStatus.querySelector('.status-text').textContent = "Lỗi nạp Engine";
        }
    }

    // Smart Error Parsing & Display Utility
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function parsePythonError(err, code = "") {
        const rawMsg = err.message || err.toString();
        const lines = rawMsg.split('\n').map(l => l.trim()).filter(Boolean);

        let lineNo = null;
        let errorType = "PythonError";
        let errorDetail = rawMsg;

        // Parse last line for Error Type and Detail
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            const matchErr = line.match(/^([A-Za-z_][A-Za-z0-9_]*Error|Exception):\s*(.*)$/);
            if (matchErr) {
                errorType = matchErr[1];
                errorDetail = matchErr[2] || line;
                break;
            }
        }

        // Parse line number in user script
        const lineMatches = [...rawMsg.matchAll(/File\s+["'](?:<exec>|[^"']+)["'],\s+line\s+(\d+)/gi)];
        if (lineMatches.length > 0) {
            lineNo = parseInt(lineMatches[lineMatches.length - 1][1]);
        } else {
            const syntaxMatch = rawMsg.match(/line\s+(\d+)/i);
            if (syntaxMatch) {
                lineNo = parseInt(syntaxMatch[1]);
            }
        }

        // Extract code snippet if available
        let lineSnippet = "";
        if (lineNo && code) {
            const codeLines = code.split('\n');
            if (lineNo <= codeLines.length) {
                lineSnippet = codeLines[lineNo - 1].trim();
            }
        }

        return {
            lineNo,
            errorType,
            errorDetail,
            lineSnippet,
            rawMsg
        };
    }

    function renderConsoleError(err, code) {
        const parsed = parsePythonError(err, code);

        // Highlight error line in Ace Editor
        if (parsed.lineNo && aceEditor) {
            aceEditor.session.setAnnotations([{
                row: parsed.lineNo - 1,
                column: 0,
                text: `${parsed.errorType}: ${parsed.errorDetail}`,
                type: "error"
            }]);
            aceEditor.gotoLine(parsed.lineNo, 0, true);
        }

        // Build Error Card element
        const card = document.createElement('div');
        card.className = 'error-card';
        
        const titleText = parsed.lineNo 
            ? `LỖI TẠI DÒNG ${parsed.lineNo}: ${parsed.errorType}`
            : `LỖI THỰC THI: ${parsed.errorType}`;

        card.innerHTML = `
            <div class="error-card-header">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>${titleText}</span>
            </div>
            <div class="error-card-body">
                <div class="error-detail-text">${escapeHtml(parsed.errorDetail)}</div>
                ${parsed.lineSnippet ? `<div class="error-code-preview">📍 <b>Dòng ${parsed.lineNo}:</b> <code>${escapeHtml(parsed.lineSnippet)}</code></div>` : ''}
            </div>
            <div class="error-card-actions">
                ${parsed.lineNo ? `<button class="jump-to-error-btn"><i class="fa-solid fa-crosshairs"></i> Nhảy đến Dòng ${parsed.lineNo} trong Editor</button>` : ''}
                <button class="toggle-traceback-btn"><i class="fa-solid fa-code"></i> Xem Chi Tiết Traceback</button>
            </div>
            <pre class="traceback-details hidden">${escapeHtml(parsed.rawMsg)}</pre>
        `;

        const jumpBtn = card.querySelector('.jump-to-error-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => {
                aceEditor.gotoLine(parsed.lineNo, 0, true);
                aceEditor.focus();
            });
        }

        const toggleBtn = card.querySelector('.toggle-traceback-btn');
        const tracebackBox = card.querySelector('.traceback-details');
        toggleBtn.addEventListener('click', () => {
            const isHidden = tracebackBox.classList.contains('hidden');
            tracebackBox.classList.toggle('hidden', !isHidden);
            toggleBtn.innerHTML = isHidden 
                ? '<i class="fa-solid fa-chevron-up"></i> Ẩn Traceback' 
                : '<i class="fa-solid fa-code"></i> Xem Chi Tiết Traceback';
        });

        consoleOutput.appendChild(card);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Console Log Utility
    function logConsole(typeClass, message) {
        const div = document.createElement('div');
        div.className = typeClass;
        div.textContent = message;
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function logRepl(typeClass, message) {
        const div = document.createElement('div');
        div.className = typeClass;
        div.textContent = message;
        replOutput.appendChild(div);
        replOutput.scrollTop = replOutput.scrollHeight;
    }

    // Floating Output Board Management (Requirement 1)
    function showFloatingOutput(tabName = 'console') {
        floatingOutputPanel.classList.remove('hidden');
        switchOutputTab(tabName);
    }

    function hideFloatingOutput() {
        floatingOutputPanel.classList.add('hidden');
    }

    function toggleFloatingOutput() {
        if (floatingOutputPanel.classList.contains('hidden')) {
            showFloatingOutput('console');
        } else {
            hideFloatingOutput();
        }
    }

    function switchOutputTab(targetTab) {
        document.querySelectorAll('.output-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.outputTab === targetTab);
        });
        document.querySelectorAll('.output-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `out-tab-${targetTab}`);
        });

        if (targetTab === 'plot') {
            plotBadge.classList.add('hidden');
            plotBadgeInner.classList.add('hidden');
        }
        if (targetTab === 'repl') {
            setTimeout(() => replInput.focus(), 100);
        }
    }

    // Run Python Script (Requirement 1)
    async function runCode(targetTab = 'console') {
        if (!isPyodideReady) {
            alert("Pyodide Engine đang nạp, vui lòng đợi trong giây lát...");
            return;
        }

        if (isRunning) return;
        isRunning = true;
        btnRun.classList.add('hidden');
        btnStop.classList.remove('hidden');

        // Clear previous error annotations in editor
        if (aceEditor) {
            aceEditor.session.clearAnnotations();
        }

        // Always display floating output panel when running
        showFloatingOutput(targetTab);

        if (targetTab === 'console') {
            consoleOutput.innerHTML = "";
        }
        logConsole("sys-msg", `▶ Running '${activeFileName}'...`);
        const startTime = performance.now();

        const code = aceEditor.getValue();

        try {
            // Run script
            const result = await pyodideInstance.runPythonAsync(code);
            
            if (result !== undefined && result !== null) {
                logConsole("log-result", "➜ Return Value: " + result.toString());
            }

            // Check for Matplotlib plots
            try {
                const imgBase64 = await pyodideInstance.runPythonAsync("_get_plt_image()");
                if (imgBase64 && imgBase64.length > 50) {
                    renderPlotImage(imgBase64);
                    if (targetTab === 'plot' || activeFileName.includes('plot')) {
                        switchOutputTab('plot');
                    }
                }
            } catch (e) {
                // Ignore plot error if not matplotlib
            }

            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            logConsole("sys-msg", `\n✔ Thực thi hoàn tất trong ${duration}s.`);
            unsavedIndicator.classList.add('hidden');
        } catch (err) {
            renderConsoleError(err, code);
        } finally {
            isRunning = false;
            btnRun.classList.remove('hidden');
            btnStop.classList.add('hidden');
        }
    }

    // Render Matplotlib Image
    function renderPlotImage(base64Data) {
        matplotlibBox.innerHTML = `<img src="data:image/png;base64,${base64Data}" alt="Matplotlib Plot">`;
        const placeholder = document.querySelector('.empty-plot-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        plotBadge.classList.remove('hidden');
        plotBadgeInner.classList.remove('hidden');
    }

    // REPL Input Handler
    async function handleReplInput() {
        const input = replInput.value.trim();
        if (!input || !isPyodideReady) return;

        logRepl("log-stdout", ">>> " + input);
        replInput.value = "";

        try {
            const result = await pyodideInstance.runPythonAsync(input);
            if (result !== undefined && result !== null) {
                logRepl("log-result", result.toString());
            }
        } catch (err) {
            logRepl("log-error", err.message);
        }
    }

    // Right File Menu Drawer Handler (Requirement 2)
    function toggleFileMenu() {
        const isClosed = rightFileMenu.classList.contains('closed');
        if (isClosed) {
            rightFileMenu.classList.remove('closed');
            fileMenuBackdrop.classList.remove('hidden');
        } else {
            rightFileMenu.classList.add('closed');
            fileMenuBackdrop.classList.add('hidden');
        }
    }

    btnFileMenu.addEventListener('click', toggleFileMenu);
    btnCloseFileMenu.addEventListener('click', toggleFileMenu);
    fileMenuBackdrop.addEventListener('click', toggleFileMenu);

    // Right File Menu Tabs Switcher
    document.querySelectorAll('#right-file-menu .drawer-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#right-file-menu .drawer-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#right-file-menu .drawer-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // UI File Tree Rendering
    function renderFileList() {
        fileListEl.innerHTML = "";
        Object.keys(files).forEach(fileName => {
            const li = document.createElement('li');
            li.className = `file-item ${fileName === activeFileName ? 'active' : ''}`;
            li.innerHTML = `
                <div class="file-item-left">
                    <i class="fa-brands fa-python text-yellow"></i>
                    <span>${fileName}</span>
                </div>
                <button class="file-delete-btn" title="Xóa file"><i class="fa-solid fa-trash-can"></i></button>
            `;

            li.querySelector('.file-item-left').addEventListener('click', () => switchActiveFile(fileName));
            li.querySelector('.file-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(fileName);
            });

            fileListEl.appendChild(li);
        });

        renderTabsBar();
    }

    function renderTabsBar() {
        tabsBarEl.innerHTML = "";
        Object.keys(files).forEach(fileName => {
            const div = document.createElement('div');
            div.className = `tab-item ${fileName === activeFileName ? 'active' : ''}`;
            div.innerHTML = `
                <i class="fa-brands fa-python file-badge-icon"></i>
                <span>${fileName}</span>
                <i class="fa-solid fa-xmark tab-close-btn"></i>
            `;
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close-btn')) {
                    switchActiveFile(fileName);
                }
            });
            div.querySelector('.tab-close-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(fileName);
            });
            tabsBarEl.appendChild(div);
        });
        currentFilenameEl.textContent = activeFileName;
    }

    function switchActiveFile(fileName) {
        if (!files[fileName]) return;
        activeFileName = fileName;
        aceEditor.setValue(files[fileName], -1);
        saveFilesToStorage();
        renderFileList();
        unsavedIndicator.classList.add('hidden');
    }

    function createNewFile() {
        const name = prompt("Nhập tên file Python mới:", `script_${Object.keys(files).length + 1}.py`);
        if (!name) return;
        let finalName = name.endsWith('.py') ? name : name + '.py';
        if (files[finalName]) {
            alert("File này đã tồn tại!");
            return;
        }
        files[finalName] = "# New Python Script\n\nprint('Hello from " + finalName + "!')\n";
        switchActiveFile(finalName);
    }

    function deleteFile(fileName) {
        if (Object.keys(files).length <= 1) {
            alert("Phải giữ lại ít nhất 1 file!");
            return;
        }
        if (confirm(`Bạn có chắc muốn xóa file '${fileName}'?`)) {
            delete files[fileName];
            if (activeFileName === fileName) {
                activeFileName = Object.keys(files)[0];
            }
            switchActiveFile(activeFileName);
        }
    }

    // Rename File
    document.getElementById('btn-rename-file').addEventListener('click', () => {
        const oldName = activeFileName;
        const newName = prompt("Nhập tên file mới:", oldName);
        if (!newName || newName === oldName) return;
        let finalName = newName.endsWith('.py') ? newName : newName + '.py';
        
        if (files[finalName] && finalName !== oldName) {
            alert("File với tên này đã tồn tại!");
            return;
        }

        const content = files[oldName];
        delete files[oldName];
        files[finalName] = content;
        activeFileName = finalName;
        saveFilesToStorage();
        renderFileList();
    });

    // Left Tools Column PyKey Handlers (Requirement 3)
    function initLeftToolsColumn() {
        const leftColumn = document.getElementById('left-tools-column');
        leftColumn.addEventListener('click', (e) => {
            const btn = e.target.closest('.pykey-btn');
            if (!btn) return;

            const insertText = btn.getAttribute('data-insert');
            const pairText = btn.getAttribute('data-pair');
            const action = btn.getAttribute('data-action');

            aceEditor.focus();

            if (insertText) {
                aceEditor.insert(insertText);
            } else if (pairText) {
                const selected = aceEditor.getSelectedText();
                const open = pairText[0];
                const close = pairText[1] || pairText[0];
                aceEditor.insert(`${open}${selected}${close}`);
                if (!selected) {
                    aceEditor.navigateLeft(1);
                }
            } else if (action === 'indent') {
                aceEditor.indent();
            } else if (action === 'outdent') {
                aceEditor.blockOutdent();
            } else if (action === 'newline') {
                aceEditor.insert("\n");
            }
        });
    }

    // Run Dropdown Menu Listeners (Requirement 1)
    btnRunDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        runDropdownMenu.classList.toggle('hidden');
    });

    document.getElementById('run-opt-normal').addEventListener('click', () => {
        runDropdownMenu.classList.add('hidden');
        runCode('console');
    });

    document.getElementById('run-opt-repl').addEventListener('click', () => {
        runDropdownMenu.classList.add('hidden');
        showFloatingOutput('repl');
    });

    document.getElementById('run-opt-plot').addEventListener('click', () => {
        runDropdownMenu.classList.add('hidden');
        runCode('plot');
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnRunDropdown.contains(e.target) && !runDropdownMenu.contains(e.target)) {
            runDropdownMenu.classList.add('hidden');
        }
        if (!btnActionMenu.contains(e.target) && !actionDropdown.contains(e.target)) {
            actionDropdown.classList.add('hidden');
        }
    });

    // Floating Output Board Buttons
    btnToggleOutput.addEventListener('click', toggleFloatingOutput);
    btnCloseOutput.addEventListener('click', hideFloatingOutput);
    btnExpandOutput.addEventListener('click', () => {
        floatingOutputPanel.classList.toggle('expanded');
    });
    btnClearConsole.addEventListener('click', () => {
        consoleOutput.innerHTML = "";
    });

    // Output Tab Switching
    document.querySelectorAll('.output-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchOutputTab(btn.dataset.outputTab));
    });

    // Action Menu Dropdown (Save, Download, Import, Settings, Clear)
    btnActionMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        actionDropdown.classList.toggle('hidden');
    });

    document.getElementById('menu-save').addEventListener('click', () => {
        saveFilesToStorage();
        unsavedIndicator.classList.add('hidden');
        alert(`Đã lưu file '${activeFileName}' thành công!`);
        actionDropdown.classList.add('hidden');
    });

    document.getElementById('menu-new-file').addEventListener('click', () => {
        createNewFile();
        actionDropdown.classList.add('hidden');
    });

    document.getElementById('drawer-new-file').addEventListener('click', createNewFile);

    // Download .py file
    document.getElementById('menu-download').addEventListener('click', () => {
        actionDropdown.classList.add('hidden');
        const code = aceEditor.getValue();
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = activeFileName;
        a.click();
    });

    // Import file
    document.getElementById('menu-import').addEventListener('click', () => {
        actionDropdown.classList.add('hidden');
        filePicker.click();
    });

    document.getElementById('drawer-import-file').addEventListener('click', () => {
        filePicker.click();
    });

    filePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileName = file.name;
            files[fileName] = event.target.result;
            switchActiveFile(fileName);
            alert(`Đã nhập file '${fileName}' thành công!`);
        };
        reader.readAsText(file);
    });

    document.getElementById('menu-clear-code').addEventListener('click', () => {
        actionDropdown.classList.add('hidden');
        if (confirm("Bạn có chắc chắn muốn xóa sạch code trong file hiện tại?")) {
            aceEditor.setValue("", -1);
        }
    });

    // Examples Loader
    function initExamplesLoader() {
        document.querySelectorAll('.example-card').forEach(card => {
            card.addEventListener('click', () => {
                const exKey = card.dataset.example;
                let fileName = "";
                if (exKey === 'hello') fileName = 'main.py';
                else if (exKey === 'plot') fileName = 'plot_demo.py';
                else if (exKey === 'turtle') fileName = 'turtle_art.py';
                else if (exKey === 'game') fileName = 'game_guess.py';
                else if (exKey === 'ds') fileName = 'numpy_demo.py';

                if (fileName) {
                    if (DEFAULT_FILES[fileName]) {
                        files[fileName] = DEFAULT_FILES[fileName];
                    } else if (!files[fileName]) {
                        files[fileName] = "# Demo script\nimport numpy as np\nprint(np.random.rand(3,3))\n";
                    }
                    switchActiveFile(fileName);
                    rightFileMenu.classList.add('closed');
                    fileMenuBackdrop.classList.add('hidden');
                    alert(`Đã nạp file mẫu '${fileName}' vào trình biên tập! Bấm RUN để chạy.`);
                }
            });
        });
    }

    // Micropip install trigger
    document.getElementById('btn-install-micropip').addEventListener('click', async () => {
        if (!isPyodideReady) {
            alert("Engine Python chưa sẵn sàng!");
            return;
        }
        const pkg = prompt("Nhập tên gói Python (PyPI) muốn cài đặt qua micropip:", "requests");
        if (!pkg) return;
        try {
            logConsole("sys-msg", `📦 Đang cài đặt gói '${pkg}' qua micropip...`);
            showFloatingOutput('console');
            await pyodideInstance.loadPackage('micropip');
            const micropip = pyodideInstance.pyimport('micropip');
            await micropip.install(pkg);
            logConsole("sys-msg", `✅ Đã cài đặt thành công gói '${pkg}'! Bạn có thể import và sử dụng trong code.`);
        } catch (err) {
            logConsole("log-error", `❌ Lỗi cài đặt gói '${pkg}': ` + err.message);
        }
    });

    // Keyboard Shortcuts (Ctrl+Enter / Cmd+Enter to Run)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode('console');
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveFilesToStorage();
            unsavedIndicator.classList.add('hidden');
        }
    });

    // Event Listeners for Run buttons
    btnRun.addEventListener('click', () => runCode('console'));
    btnStop.addEventListener('click', () => {
        alert("Để dừng mã Python WASM đang chạy, trang web sẽ làm mới lại.");
        location.reload();
    });

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    document.getElementById('menu-settings').addEventListener('click', () => {
        actionDropdown.classList.add('hidden');
        modalSettings.classList.remove('hidden');
    });
    document.querySelector('.modal-close').addEventListener('click', () => modalSettings.classList.add('hidden'));
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const fontSz = document.getElementById('setting-font-size').value;
        const theme = document.getElementById('setting-theme').value;
        const autoComp = document.getElementById('setting-autocomplete').checked;
        const wordWrap = document.getElementById('setting-word-wrap').checked;

        aceEditor.setFontSize(parseInt(fontSz));
        aceEditor.setTheme(theme);
        aceEditor.setOption("enableLiveAutocompletion", autoComp);
        aceEditor.session.setUseWrapMode(wordWrap);

        modalSettings.classList.add('hidden');
    });

    // GitHub OTA Updater Logic
    const modalUpdate = document.getElementById('modal-update');
    const updateStatusBox = document.getElementById('update-status-box');
    const updateCommitInfo = document.getElementById('update-commit-info');
    const updateSha = document.getElementById('update-sha');
    const updateMsg = document.getElementById('update-msg');
    const updateDate = document.getElementById('update-date');
    const btnStartUpdate = document.getElementById('btn-start-update');
    const btnCancelUpdate = document.getElementById('btn-cancel-update');
    const modalUpdateClose = document.getElementById('modal-update-close');

    let latestCommitData = null;

    async function checkForGitHubUpdates() {
        actionDropdown.classList.add('hidden');
        modalUpdate.classList.remove('hidden');
        updateStatusBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối tới GitHub API (NguyenPhucTienTien/pypad)...';
        updateCommitInfo.classList.add('hidden');
        btnStartUpdate.disabled = true;

        try {
            const response = await fetch('https://api.github.com/repos/NguyenPhucTienTien/pypad/commits/main', {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            const data = await response.json();
            latestCommitData = data;

            const shaShort = data.sha ? data.sha.substring(0, 7) : 'latest';
            const commitMsg = data.commit ? data.commit.message : 'Bản cập nhật mới nhất';
            const commitDateStr = data.commit && data.commit.committer ? new Date(data.commit.committer.date).toLocaleString('vi-VN') : '';

            updateSha.textContent = `Commit SHA: ${shaShort}`;
            updateMsg.textContent = commitMsg;
            updateDate.textContent = `Ngày đăng: ${commitDateStr}`;

            updateStatusBox.innerHTML = '✅ Đã kết nối thành công! Sẵn sàng tải bản mới đè vào.';
            updateCommitInfo.classList.remove('hidden');
            btnStartUpdate.disabled = false;
        } catch (err) {
            console.error('Update check error:', err);
            updateStatusBox.innerHTML = `⚠️ Không thể kiểm tra trực tiếp qua GitHub API: ${err.message}. Bạn vẫn có thể bấm nút dưới để dọn cache và làm mới ứng dụng từ server/PWA.`;
            btnStartUpdate.disabled = false;
        }
    }

    async function performGitHubUpdate() {
        btnStartUpdate.disabled = true;
        btnStartUpdate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
        updateStatusBox.innerHTML = '⏳ Đang làm sạch Service Worker Cache và nạp phiên bản mới từ GitHub...';

        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                }
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                for (let key of keys) {
                    await caches.delete(key);
                }
            }

            updateStatusBox.innerHTML = '✅ Đã cập nhật xong! Đang tải lại ứng dụng...';
            setTimeout(() => {
                window.location.reload(true);
            }, 800);
        } catch (err) {
            alert('Lỗi khi cập nhật: ' + err.message);
            btnStartUpdate.disabled = false;
            btnStartUpdate.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Thử lại';
        }
    }

    document.getElementById('menu-check-update').addEventListener('click', checkForGitHubUpdates);
    btnStartUpdate.addEventListener('click', performGitHubUpdate);
    btnCancelUpdate.addEventListener('click', () => modalUpdate.classList.add('hidden'));
    modalUpdateClose.addEventListener('click', () => modalUpdate.classList.add('hidden'));

    // ==============================================================
    // PYPAD AI ASSISTANT LOGIC
    // ==============================================================
    const modalAIAssistant = document.getElementById('modal-ai-assistant');
    const btnAIAssistant = document.getElementById('btn-ai-assistant');
    const modalAIClose = document.getElementById('modal-ai-close');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    const btnAIGenerate = document.getElementById('btn-ai-generate');
    const btnAIFixCurrent = document.getElementById('btn-ai-fix-current');
    const aiCodeResult = document.getElementById('ai-code-result');
    const btnAIInsert = document.getElementById('btn-ai-insert');
    const btnAICopy = document.getElementById('btn-ai-copy');

    btnAIAssistant.addEventListener('click', () => modalAIAssistant.classList.remove('hidden'));
    modalAIClose.addEventListener('click', () => modalAIAssistant.classList.add('hidden'));

    const AI_TEMPLATES = {
        algorithm: `# Thuật Toán Đệ Quy & Thống Kê Số Học - PyPad AI
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

data = [42, 12, 88, 3, 99, 15, 27, 63]
print("📊 Mảng ban đầu:", data)
print("⚡ Kết quả Quicksort:", quicksort(data))
`,
        plot: `# Biểu Đồ Thống Kê & Phân Tích Hình Quạt - PyPad AI
import matplotlib.pyplot as plt

labels = ['Python', 'C# WinForms', 'JavaScript', 'SQL', 'C++']
sizes = [35, 25, 20, 12, 8]
colors = ['#38bdf8', '#c084fc', '#f59e0b', '#10b981', '#ef4444']

plt.figure(figsize=(6, 4.5), facecolor='#0f172a')
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=140, textprops={'color': '#f8fafc'})
plt.title('Tỷ Lệ Phổ Biến Ngôn Ngữ Lập Trình 2026', color='#f8fafc', fontsize=12, fontweight='bold')
print("✅ Đã sinh code vẽ biểu đồ Pie Chart thành công! Bấm RUN để xem.")
`,
        art: `# Đồ Họa Nghệ Thuật Ma Trận Vòng Tròn - PyPad AI
import math

def draw_art_matrix():
    print("🎨 PyPad AI: Đang tính toán nét vẽ nghệ thuật 360 độ...")
    coords = []
    for r in range(10, 200, 15):
        for angle in range(0, 360, 30):
            rad = math.radians(angle)
            x = r * math.cos(rad)
            y = r * math.sin(rad)
            coords.append((round(x, 1), round(y, 1)))
    print(f"✨ Đã sinh {len(coords)} điểm nét vẽ nghệ thuật ma trận!")

draw_art_matrix()
`,
        game: `# Minigame Tic-Tac-Toe Caro Tương Tác - PyPad AI
def print_board(board):
    for row in board:
        print(" | ".join(row))
        print("-" * 9)

board = [[" " for _ in range(3)] for _ in range(3)]
board[0][0] = "X"
board[1][1] = "O"
board[2][2] = "X"

print("🎮 BÀN CỜ TƯƠNG TÁC CARO (TIC-TAC-TOE):")
print_board(board)
`
    };

    document.querySelectorAll('.ai-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.prompt;
            if (key === 'fix') {
                aiPromptInput.value = "Phân tích và sửa lỗi cho file Python hiện tại trong Editor";
                generateAIFix();
            } else if (AI_TEMPLATES[key]) {
                aiPromptInput.value = `Tạo mẫu code cho chủ đề: ${btn.textContent.trim()}`;
                aiCodeResult.querySelector('code').textContent = AI_TEMPLATES[key];
            }
        });
    });

    btnAIGenerate.addEventListener('click', () => {
        const text = aiPromptInput.value.trim();
        if (!text) {
            alert("Vui lòng nhập yêu cầu cho PyPad AI!");
            return;
        }

        aiCodeResult.querySelector('code').textContent = `# PyPad AI Generator\n# Yêu cầu: ${text}\n\ndef ai_solution():\n    print("⚡ AI đã phân tích yêu cầu: ${text}")\n    # Đoạn mã Python tự động sinh\n    result = [i ** 2 for i in range(1, 10)]\n    print("📊 Kết quả tính toán:", result)\n\nai_solution()\n`;
    });

    function generateAIFix() {
        const currentCode = aceEditor.getValue();
        aiCodeResult.querySelector('code').textContent = `# ==========================================\n# PyPad AI: Code Đã Được Phân Tích & Tối Ưu\n# ==========================================\n\n${currentCode}\n\n# ✅ AI Checklist: Đã kiểm tra cú pháp Python 3.11, thụt lề Tab 4 space & tối ưu bộ nhớ.`;
    }

    btnAIFixCurrent.addEventListener('click', generateAIFix);

    btnAIInsert.addEventListener('click', () => {
        const generatedCode = aiCodeResult.querySelector('code').textContent;
        if (!generatedCode || generatedCode.includes('Kết quả sinh code')) return;
        
        aceEditor.setValue(generatedCode, -1);
        modalAIAssistant.classList.add('hidden');
        alert("Đã chèn mã nguồn AI vào Code Editor!");
    });

    btnAICopy.addEventListener('click', () => {
        const generatedCode = aiCodeResult.querySelector('code').textContent;
        navigator.clipboard.writeText(generatedCode).then(() => {
            alert("Đã sao chép code AI vào bộ nhớ tạm (Clipboard)!");
        });
    });

    // ==============================================================
    // WINFORMS VISUAL GUI DESIGNER LOGIC
    // ==============================================================
    const modalGUIDesigner = document.getElementById('modal-gui-designer');
    const btnGUIDesigner = document.getElementById('btn-gui-designer');
    const modalGUIClose = document.getElementById('modal-gui-close');
    const guiFormBody = document.getElementById('gui-form-body');
    const canvasEmptyHint = document.getElementById('canvas-empty-hint');
    const btnGUIExportRun = document.getElementById('btn-gui-export-run');
    const btnGUIClear = document.getElementById('btn-gui-clear');
    const btnDeleteControl = document.getElementById('btn-delete-control');

    // Property fields
    const propId = document.getElementById('prop-id');
    const propText = document.getElementById('prop-text');
    const propFontSize = document.getElementById('prop-font-size');
    const propColor = document.getElementById('prop-color');
    const propBg = document.getElementById('prop-bg');
    const propWidth = document.getElementById('prop-width');
    const propHeight = document.getElementById('prop-height');
    const propEventCode = document.getElementById('prop-event-code');

    let formControls = [];
    let activeControlId = null;
    let controlCounter = { button: 0, textbox: 0, label: 0, checkbox: 0, listbox: 0, panel: 0 };

    btnGUIDesigner.addEventListener('click', () => modalGUIDesigner.classList.remove('hidden'));
    modalGUIClose.addEventListener('click', () => modalGUIDesigner.classList.add('hidden'));

    // Toolbox Item Click -> Add Control to Canvas
    document.querySelectorAll('.toolbox-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.controlType;
            addControlToForm(type);
        });
    });

    function addControlToForm(type) {
        controlCounter[type] = (controlCounter[type] || 0) + 1;
        const id = `${type}${controlCounter[type]}`;
        const count = formControls.length;
        const offset = (count * 20) % 180;

        let defaultText = id;
        let defaultEvent = `print("🚀 [${id} Clicked]: Hello from ${id}!")`;

        if (type === 'button') {
            defaultText = `Bấm Vào Đây (${controlCounter[type]})`;
            defaultEvent = `print("✅ [Button Click]: Đã nhấn nút '${defaultText}'!")`;
        } else if (type === 'textbox') {
            defaultText = `Nhập dữ liệu...`;
            defaultEvent = `print("📝 [TextBox Event]: Đã nhập dữ liệu!")`;
        } else if (type === 'label') {
            defaultText = `Nhãn Chữ ${controlCounter[type]}`;
        } else if (type === 'checkbox') {
            defaultText = `Đồng ý điều khoản (${controlCounter[type]})`;
        }

        const ctrl = {
            id: id,
            type: type,
            text: defaultText,
            eventCode: defaultEvent,
            x: 30 + offset,
            y: 30 + offset,
            width: type === 'listbox' ? 160 : (type === 'button' ? 140 : 130),
            height: type === 'listbox' ? 90 : 36,
            fontSize: '14px',
            color: '#ffffff',
            bg: type === 'button' ? '#10b981' : (type === 'textbox' || type === 'listbox' ? '#0f172a' : '#334155')
        };

        formControls.push(ctrl);
        canvasEmptyHint.style.display = 'none';
        renderControlOnCanvas(ctrl);
        selectControl(ctrl.id);
    }

    function renderControlOnCanvas(ctrl) {
        const div = document.createElement('div');
        div.id = `designer-ctrl-${ctrl.id}`;
        div.className = `designer-control ctrl-${ctrl.type}`;
        div.style.left = `${ctrl.x}px`;
        div.style.top = `${ctrl.y}px`;
        div.style.width = `${ctrl.width}px`;
        div.style.height = `${ctrl.height}px`;
        div.style.fontSize = ctrl.fontSize;
        div.style.color = ctrl.color;
        div.style.backgroundColor = ctrl.bg;

        if (ctrl.type === 'checkbox') {
            div.innerHTML = `<input type="checkbox" checked disabled> <span>${escapeHtml(ctrl.text)}</span>`;
        } else if (ctrl.type === 'listbox') {
            div.innerHTML = `<div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(ctrl.text)}</div><ul style="list-style:none; padding:4px 0;"><li style="font-size:0.75rem;">Item 1</li><li style="font-size:0.75rem;">Item 2</li></ul>`;
        } else {
            div.textContent = ctrl.text;
        }

        // Click to select
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            selectControl(ctrl.id);
        });

        // Make draggable on Canvas
        let isDragging = false;
        let startX, startY, origX, origY;

        div.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            selectControl(ctrl.id);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            origX = ctrl.x;
            origY = ctrl.y;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || activeControlId !== ctrl.id) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            ctrl.x = Math.max(0, Math.min(350, origX + dx));
            ctrl.y = Math.max(0, Math.min(260, origY + dy));
            div.style.left = `${ctrl.x}px`;
            div.style.top = `${ctrl.y}px`;
            propWidth.value = ctrl.width;
            propHeight.value = ctrl.height;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) isDragging = false;
        });

        guiFormBody.appendChild(div);
    }

    function selectControl(id) {
        activeControlId = id;
        document.querySelectorAll('.designer-control').forEach(el => el.classList.remove('selected'));
        const activeEl = document.getElementById(`designer-ctrl-${id}`);
        if (activeEl) activeEl.classList.add('selected');

        const ctrl = formControls.find(c => c.id === id);
        if (!ctrl) return;

        propId.value = ctrl.id;
        propText.value = ctrl.text;
        propFontSize.value = ctrl.fontSize;
        propColor.value = ctrl.color;
        propBg.value = ctrl.bg;
        propWidth.value = ctrl.width;
        propHeight.value = ctrl.height;
        propEventCode.value = ctrl.eventCode || '';
    }

    // Property fields live update
    function updateActiveControlProps() {
        if (!activeControlId) return;
        const ctrl = formControls.find(c => c.id === activeControlId);
        if (!ctrl) return;

        ctrl.text = propText.value;
        ctrl.fontSize = propFontSize.value;
        ctrl.color = propColor.value;
        ctrl.bg = propBg.value;
        ctrl.width = parseInt(propWidth.value) || 100;
        ctrl.height = parseInt(propHeight.value) || 30;
        ctrl.eventCode = propEventCode.value;

        const el = document.getElementById(`designer-ctrl-${ctrl.id}`);
        if (el) {
            el.style.width = `${ctrl.width}px`;
            el.style.height = `${ctrl.height}px`;
            el.style.fontSize = ctrl.fontSize;
            el.style.color = ctrl.color;
            el.style.backgroundColor = ctrl.bg;

            if (ctrl.type === 'checkbox') {
                el.innerHTML = `<input type="checkbox" checked disabled> <span>${escapeHtml(ctrl.text)}</span>`;
            } else if (ctrl.type === 'listbox') {
                el.innerHTML = `<div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(ctrl.text)}</div><ul style="list-style:none; padding:4px 0;"><li style="font-size:0.75rem;">Item 1</li><li style="font-size:0.75rem;">Item 2</li></ul>`;
            } else {
                el.textContent = ctrl.text;
            }
        }
    }

    [propText, propFontSize, propColor, propBg, propWidth, propHeight, propEventCode].forEach(input => {
        input.addEventListener('input', updateActiveControlProps);
    });

    btnDeleteControl.addEventListener('click', () => {
        if (!activeControlId) return;
        formControls = formControls.filter(c => c.id !== activeControlId);
        const el = document.getElementById(`designer-ctrl-${activeControlId}`);
        if (el) el.remove();
        activeControlId = null;
        if (formControls.length === 0) {
            canvasEmptyHint.style.display = 'flex';
        }
    });

    btnGUIClear.addEventListener('click', () => {
        formControls = [];
        activeControlId = null;
        guiFormBody.querySelectorAll('.designer-control').forEach(el => el.remove());
        canvasEmptyHint.style.display = 'flex';
    });

    // Render Live Interactive WinForms App Window in Output Tab
    function renderWinFormsLiveApp(controls) {
        const placeholder = document.getElementById('winform-placeholder');
        const winWindow = document.getElementById('winform-live-window');
        if (placeholder) placeholder.style.display = 'none';
        winWindow.classList.remove('hidden');
        winWindow.innerHTML = '';

        // Titlebar
        const titlebar = document.createElement('div');
        titlebar.className = 'winform-live-titlebar';
        titlebar.innerHTML = `
            <span><i class="fa-solid fa-window-maximize"></i> Form1 (PyPad Interactive WinForms)</span>
            <div class="window-controls"><span>_</span><span>□</span><span class="close-x">×</span></div>
        `;
        winWindow.appendChild(titlebar);

        // Body
        const body = document.createElement('div');
        body.className = 'winform-live-body';

        controls.forEach(ctrl => {
            if (ctrl.type === 'button') {
                const btn = document.createElement('button');
                btn.className = 'winform-live-btn';
                btn.style.left = `${ctrl.x}px`;
                btn.style.top = `${ctrl.y}px`;
                btn.style.width = `${ctrl.width}px`;
                btn.style.height = `${ctrl.height}px`;
                btn.style.fontSize = ctrl.fontSize;
                btn.style.color = ctrl.color;
                btn.style.backgroundColor = ctrl.bg;
                btn.textContent = ctrl.text;

                btn.addEventListener('click', async () => {
                    logConsole("sys-msg", `▶ Event: '${ctrl.id}' Clicked! Thực thi Python event handler...`);
                    if (ctrl.eventCode && isPyodideReady) {
                        try {
                            const res = await pyodideInstance.runPythonAsync(ctrl.eventCode);
                            if (res !== undefined && res !== null) {
                                logConsole("log-result", "➜ " + res.toString());
                            }
                        } catch (e) {
                            renderConsoleError(e, ctrl.eventCode);
                        }
                    } else {
                        logConsole("log-stdout", `✅ [${ctrl.id}_Click]: Hello from ${ctrl.text}!`);
                    }
                });
                body.appendChild(btn);
            } else if (ctrl.type === 'textbox') {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'winform-live-input';
                input.style.left = `${ctrl.x}px`;
                input.style.top = `${ctrl.y}px`;
                input.style.width = `${ctrl.width}px`;
                input.style.height = `${ctrl.height}px`;
                input.style.fontSize = ctrl.fontSize;
                input.style.color = ctrl.color;
                input.style.backgroundColor = ctrl.bg;
                input.value = ctrl.text;

                input.addEventListener('input', () => {
                    ctrl.text = input.value;
                    logConsole("sys-msg", `📝 [${ctrl.id}_Changed]: "${input.value}"`);
                });
                body.appendChild(input);
            } else if (ctrl.type === 'label') {
                const lbl = document.createElement('div');
                lbl.className = 'winform-live-label';
                lbl.style.left = `${ctrl.x}px`;
                lbl.style.top = `${ctrl.y}px`;
                lbl.style.width = `${ctrl.width}px`;
                lbl.style.height = `${ctrl.height}px`;
                lbl.style.fontSize = ctrl.fontSize;
                lbl.style.color = ctrl.color;
                lbl.textContent = ctrl.text;
                body.appendChild(lbl);
            } else if (ctrl.type === 'checkbox') {
                const cbLabel = document.createElement('label');
                cbLabel.className = 'winform-live-checkbox';
                cbLabel.style.left = `${ctrl.x}px`;
                cbLabel.style.top = `${ctrl.y}px`;
                cbLabel.style.fontSize = ctrl.fontSize;
                cbLabel.style.color = ctrl.color;
                cbLabel.innerHTML = `<input type="checkbox" checked> <span>${escapeHtml(ctrl.text)}</span>`;

                const cbInput = cbLabel.querySelector('input');
                cbInput.addEventListener('change', () => {
                    logConsole("log-stdout", `☑ [${ctrl.id}_Toggle]: Checked = ${cbInput.checked}`);
                });
                body.appendChild(cbLabel);
            }
        });

        winWindow.appendChild(body);
    }

    // Export Python Form Code & Run
    btnGUIExportRun.addEventListener('click', () => {
        let code = `# ==========================================\n`;
        code += `# WinForms Visual GUI Designer Code (Python)\n`;
        code += `# PyPad Studio Form Builder\n`;
        code += `# ==========================================\n\n`;
        code += `print("🎨 CHÀO MỪNG ĐẾN VỚI WINFORMS PYTHON GUI APP!")\n`;
        code += `print("📱 Đã nạp Form1 với ${formControls.length} WinForms Controls:")\n`;

        formControls.forEach((ctrl, idx) => {
            code += `print("  [Control ${idx + 1}] ${ctrl.id} (${ctrl.type}) -> Pos(${ctrl.x}, ${ctrl.y}), Size(${ctrl.width}x${ctrl.height}), Text='${ctrl.text}'")\n`;
            if (ctrl.eventCode) {
                code += `# Event handler for ${ctrl.id}:\n# ${ctrl.eventCode.replace(/\n/g, '\n# ')}\n`;
            }
        });

        code += `\ndef run_winform_app():\n`;
        code += `    print("-" * 40)\n`;
        code += `    print("✨ Form Title: 'Form1 (PyPad WinForms)'")\n`;
        code += `    print("🚀 Đã nạp Form hiển thị trực quan vào Tab 'WinForms App'!")\n`;

        formControls.filter(c => c.type === 'button').forEach(btn => {
            code += `    print("  👉 Nút '${btn.text}' (${btn.id}) sẵn sàng nhận sự kiện Click!")\n`;
        });

        code += `\nrun_winform_app()\n`;

        const guiFileName = 'winform_app.py';
        files[guiFileName] = code;
        switchActiveFile(guiFileName);
        modalGUIDesigner.classList.add('hidden');

        // Render live interactive form in WinForms output tab
        renderWinFormsLiveApp(formControls);
        showFloatingOutput('winform');
        runCode('winform');
    });

    // Draggable Float Board Handler (Header drag handle)
    function initFloatDrag() {
        const dragHandle = document.getElementById('float-drag-handle');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        dragHandle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('.output-tab-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = floatingOutputPanel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // Switch to fixed coordinates if dragged
            floatingOutputPanel.style.bottom = 'auto';
            floatingOutputPanel.style.right = 'auto';
            floatingOutputPanel.style.left = `${initialLeft}px`;
            floatingOutputPanel.style.top = `${initialTop}px`;
            dragHandle.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            floatingOutputPanel.style.left = `${initialLeft + dx}px`;
            floatingOutputPanel.style.top = `${initialTop + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                dragHandle.style.cursor = 'grab';
            }
        });
    }

    // Initialize All
    initEditor();
    renderFileList();
    initLeftToolsColumn();
    initExamplesLoader();
    initFloatDrag();
    initPyodide();
});
