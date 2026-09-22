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
            logConsole("log-error", "Traceback (most recent call last):\n" + err.message);
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
