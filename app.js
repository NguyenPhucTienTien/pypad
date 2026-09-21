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
# Welcome to PyPad Studio for iPad!
# App Lập Trình Python Cầm Tay Cực Mượt
# ==========================================

import math
import sys
import random

def welcome():
    print("🚀 PyPad Engine Version: Python", sys.version.split()[0])
    print("📱 Thiết bị:", "iPad / Tablet Touch Mode Ready")
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

print("✅ Đã tạo xong biểu đồ Matplotlib! Hãy chuyển sang Tab 'Đồ họa & Biểu đồ' để xem.")
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
    print("Máy tính đã chọn 1 bí mật.")
    
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
    const fileListEl = document.getElementById('file-list');
    const tabsBarEl = document.getElementById('tabs-bar');
    const currentFilenameEl = document.getElementById('current-filename');
    const unsavedIndicator = document.getElementById('unsaved-indicator');
    const plotContainer = document.getElementById('plot-container');
    const matplotlibBox = document.getElementById('matplotlib-output');
    const plotBadge = document.getElementById('plot-badge');
    const sidebar = document.getElementById('sidebar');

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
            logConsole("sys-msg", "⚙️ Đang tải Python WASM Runtime (Pyodide v0.26)...");
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
        } catch (err) {
            logConsole("log-error", "❌ Lỗi khởi tạo Pyodide: " + err.message);
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

    // Run Python Script
    async function runCode() {
        if (!isPyodideReady) {
            alert("Pyodide Engine đang nạp, vui lòng đợi trong giây lát...");
            return;
        }

        if (isRunning) return;
        isRunning = true;
        btnRun.classList.add('hidden');
        btnStop.classList.remove('hidden');

        // Clear previous outputs
        consoleOutput.innerHTML = "";
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
        
        // Auto switch output tab if user wrote plot code
        if (activeFileName.includes('plot')) {
            switchOutputTab('plot');
        }
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

    // UI File Tree Rendering
    function renderFileList() {
        fileListEl.innerHTML = "";
        Object.keys(files).forEach(fileName => {
            const li = document.createElement('li');
            li.className = `file-item ${fileName === activeFileName ? 'active' : ''}`;
            li.innerHTML = `
                <div class="file-item-left">
                    <i class="fa-regular fa-file-code"></i>
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
                <i class="fa-brands fa-python"></i>
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

    // PyKey Touch Bar Handler for iPad
    function initPyKeyToolbar() {
        const toolbar = document.getElementById('pykey-toolbar');
        toolbar.addEventListener('click', (e) => {
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
            } else if (action === 'clear-editor') {
                if (confirm("Xóa toàn bộ code trong editor hiện tại?")) {
                    aceEditor.setValue("", -1);
                }
            }
        });
    }

    // Output Tabs Switching
    function switchOutputTab(targetTab) {
        document.querySelectorAll('.output-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.outputTab === targetTab);
        });
        document.querySelectorAll('.output-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `out-tab-${targetTab}`);
        });
        if (targetTab === 'plot') {
            plotBadge.classList.add('hidden');
        }
    }

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

                if (fileName && DEFAULT_FILES[fileName]) {
                    files[fileName] = DEFAULT_FILES[fileName];
                    switchActiveFile(fileName);
                    alert(`Đã nạp file mẫu '${fileName}' vào trình biên tập! Bấm RUN để chạy.`);
                }
            });
        });
    }

    // Event Listeners
    btnRun.addEventListener('click', runCode);
    document.getElementById('btn-new-file').addEventListener('click', createNewFile);
    document.getElementById('sidebar-new-file').addEventListener('click', createNewFile);
    document.getElementById('btn-save').addEventListener('click', () => {
        saveFilesToStorage();
        unsavedIndicator.classList.add('hidden');
        alert(`Đã lưu file '${activeFileName}' thành công!`);
    });

    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });

    document.getElementById('btn-clear-console').addEventListener('click', () => {
        consoleOutput.innerHTML = "";
    });

    replSendBtn.addEventListener('click', handleReplInput);
    replInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleReplInput();
    });

    // Keyboard Shortcuts (Ctrl+Enter / Cmd+Enter to Run)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });

    // Sidebar tab switcher
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.sidebar-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Output tab switcher
    document.querySelectorAll('.output-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchOutputTab(btn.dataset.outputTab));
    });

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    document.getElementById('btn-settings').addEventListener('click', () => modalSettings.classList.remove('hidden'));
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

    // Initialize All
    initEditor();
    renderFileList();
    initPyKeyToolbar();
    initExamplesLoader();
    initPyodide();
});
