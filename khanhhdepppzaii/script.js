const faces = {
    bau: { name: "Bầu", icon: "🍐" },
    cua: { name: "Cua", icon: "🦀" },
    tom: { name: "Tôm", icon: "🦐" },
    ca: { name: "Cá", icon: "🐟" },
    huou: { name: "Hươu", icon: "🦌" },
    ga: { name: "Gà", icon: "🐓" }
};

const faceKeys = Object.keys(faces);

let currentAccount = null;
let selectedFaces = [];
let bets = {};
let otpCode = null;
let isSpinning = false;

function getAccounts() {
    try {
        return JSON.parse(localStorage.getItem("bauCuaAccounts") || "{}");
    } catch {
        return {};
    }
}

function saveAccounts(accounts) {
    localStorage.setItem("bauCuaAccounts", JSON.stringify(accounts));
}

function showRegister() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
    clearMessage();
}

function showLogin() {
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    clearMessage();
}

function clearMessage() {
    document.getElementById("loginMessage").textContent = "";
    document.getElementById("registerMessage").textContent = "";
}

function sendOTP() {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const password2 = document.getElementById("registerPassword2").value;
    const email = document.getElementById("registerEmail").value.trim();
    const message = document.getElementById("registerMessage");

    if (username.length < 3) {
        message.textContent = "Tên tài khoản phải có ít nhất 3 ký tự.";
        return;
    }

    if (password.length < 6) {
        message.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
        return;
    }

    if (password !== password2) {
        message.textContent = "Hai mật khẩu không giống nhau.";
        return;
    }

    if (!email || !email.includes("@")) {
        message.textContent = "Vui lòng nhập email hợp lệ.";
        return;
    }

    const accounts = getAccounts();

    if (accounts[username]) {
        message.textContent = "Tên tài khoản đã tồn tại.";
        return;
    }

    otpCode = String(Math.floor(100000 + Math.random() * 900000));

    document.getElementById("demoOTP").textContent = otpCode;
    document.getElementById("otpArea").classList.remove("hidden");

    message.textContent = "OTP demo đã được tạo. Nhập mã hiển thị ở trên.";
}

function register() {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const email = document.getElementById("registerEmail").value.trim();
    const enteredOTP = document.getElementById("otpInput").value.trim();
    const message = document.getElementById("registerMessage");

    if (!otpCode || enteredOTP !== otpCode) {
        message.textContent = "Mã OTP không chính xác.";
        return;
    }

    const accounts = getAccounts();

    if (accounts[username]) {
        message.textContent = "Tài khoản đã tồn tại.";
        return;
    }

    accounts[username] = {
        username,
        password,
        email,
        balance: 100000,
        history: [],
        createdAt: new Date().toISOString()
    };

    saveAccounts(accounts);
    otpCode = null;

    message.textContent = "Đăng ký thành công! Tài khoản nhận 100.000 điểm ảo.";

    setTimeout(() => {
        showLogin();
        document.getElementById("loginUsername").value = username;
        document.getElementById("loginMessage").textContent =
            "Đăng ký thành công. Hãy đăng nhập.";
    }, 700);
}

function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const accounts = getAccounts();

    if (!accounts[username]) {
        document.getElementById("loginMessage").textContent =
            "Tài khoản không tồn tại.";
        return;
    }

    if (accounts[username].password !== password) {
        document.getElementById("loginMessage").textContent =
            "Mật khẩu không chính xác.";
        return;
    }

    currentAccount = username;
    localStorage.setItem("bauCuaCurrentUser", username);
    openGame();
}

function openGame() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    loadAccount();
}

function loadAccount() {
    const accounts = getAccounts();
    const account = accounts[currentAccount];

    if (!account) {
        logout();
        return;
    }

    document.getElementById("currentUser").textContent = account.username;
    updateBalance();
    renderHistory();
}

function updateBalance() {
    const accounts = getAccounts();
    const account = accounts[currentAccount];

    if (!account) return;

    document.getElementById("balance").textContent =
        formatNumber(account.balance);
}

function selectFace(button) {
    if (isSpinning) return;

    const face = button.dataset.face;

    if (selectedFaces.includes(face)) {
        selectedFaces = selectedFaces.filter(item => item !== face);
        delete bets[face];

        button.classList.remove("selected");
        button.querySelector("small").textContent = "0 điểm";

        renderSelectedBets();
        return;
    }

    if (selectedFaces.length >= 3) {
        alert("Bạn chỉ có thể chọn tối đa 3 mặt.");
        return;
    }

    selectedFaces.push(face);

    const amount = getBetInput();
    bets[face] = amount;

    button.classList.add("selected");
    button.querySelector("small").textContent =
        formatNumber(amount) + " điểm";

    renderSelectedBets();
}

function getBetInput() {
    const amount = Number(document.getElementById("betAmount").value);

    if (!Number.isInteger(amount) || amount < 100) {
        return 1000;
    }

    return amount;
}

function setBet(amount) {
    document.getElementById("betAmount").value = amount;

    if (selectedFaces.length === 0) return;

    const face = selectedFaces[selectedFaces.length - 1];
    bets[face] = amount;

    const button = document.querySelector(`[data-face="${face}"]`);

    if (button) {
        button.querySelector("small").textContent =
            formatNumber(amount) + " điểm";
    }

    renderSelectedBets();
}

function renderSelectedBets() {
    const container = document.getElementById("selectedBets");
    const totalElement = document.getElementById("totalBet");

    if (selectedFaces.length === 0) {
        container.textContent = "Chưa chọn mặt";
        totalElement.textContent = "0";
        return;
    }

    container.innerHTML = "";

    selectedFaces.forEach(face => {
        const row = document.createElement("div");
        row.className = "bet-row";

        row.innerHTML = `
            <span>${faces[face].icon} ${faces[face].name}</span>
            <b>${formatNumber(bets[face] || 0)}</b>
        `;

        container.appendChild(row);
    });

    totalElement.textContent = formatNumber(getTotalBet());
}

function getTotalBet() {
    return selectedFaces.reduce((total, face) => {
        return total + Number(bets[face] || 0);
    }, 0);
}

function randomFace() {
    return faceKeys[Math.floor(Math.random() * faceKeys.length)];
}

function spin() {
    if (isSpinning) return;

    if (selectedFaces.length === 0) {
        alert("Vui lòng chọn ít nhất 1 mặt.");
        return;
    }

    const totalBet = getTotalBet();
    const accounts = getAccounts();
    const account = accounts[currentAccount];

    if (!Number.isInteger(totalBet) || totalBet <= 0) {
        alert("Số điểm cược không hợp lệ.");
        return;
    }

    if (totalBet > account.balance) {
        alert("Bạn không đủ điểm.");
        return;
    }

    isSpinning = true;
    document.getElementById("spinButton").disabled = true;

    account.balance -= totalBet;
    saveAccounts(accounts);
    updateBalance();

    const dice = [
        document.getElementById("dice1"),
        document.getElementById("dice2"),
        document.getElementById("dice3")
    ];

    dice.forEach(item => item.classList.add("rolling"));

    document.getElementById("result").textContent = "🎲 Đang lắc...";

    const results = [randomFace(), randomFace(), randomFace()];

    const animation = setInterval(() => {
        dice.forEach(item => {
            item.textContent = faces[randomFace()].icon;
        });
    }, 100);

    setTimeout(() => {
        clearInterval(animation);

        dice.forEach(item => item.classList.remove("rolling"));

        dice[0].textContent = faces[results[0]].icon;
        dice[1].textContent = faces[results[1]].icon;
        dice[2].textContent = faces[results[2]].icon;

        calculateResult(results, totalBet);

        isSpinning = false;
        document.getElementById("spinButton").disabled = false;
    }, 2200);
}

function calculateResult(results, totalBet) {
    const accounts = getAccounts();
    const account = accounts[currentAccount];

    let totalPayout = 0;
    const winners = [];

    selectedFaces.forEach(face => {
        const count = results.filter(result => result === face).length;
        const bet = Number(bets[face] || 0);

        if (count > 0) {
            const payout = bet * (count + 1);
            totalPayout += payout;

            winners.push(
                `${faces[face].icon} ${faces[face].name} xuất hiện ${count} lần`
            );
        }
    });

    account.balance += totalPayout;
    saveAccounts(accounts);
    updateBalance();

    const resultText = results.map(face =>
        `${faces[face].icon} ${faces[face].name}`
    ).join(" | ");

    let message;

    if (totalPayout > 0) {
        message = `
            <div style="color:#63ff87;font-weight:bold;">
                🎉 ${winners.join("<br>")}
                <br>
                Nhận +${formatNumber(totalPayout)} điểm
            </div>
        `;
    } else {
        message = `
            <div style="color:#ff7474;">
                ❌ Không trúng.
                <br>
                Mất ${formatNumber(totalBet)} điểm
            </div>
        `;
    }

    document.getElementById("result").innerHTML = `
        <div>${resultText}</div>
        ${message}
    `;

    addHistory(results, totalBet, totalPayout);
    clearSelections();
}

function addHistory(results, totalBet, payout) {
    const accounts = getAccounts();
    const account = accounts[currentAccount];

    account.history.unshift({
        time: new Date().toLocaleString("vi-VN"),
        results,
        bet: totalBet,
        payout
    });

    account.history = account.history.slice(0, 50);

    saveAccounts(accounts);
    renderHistory();
}

function renderHistory() {
    const accounts = getAccounts();
    const account = accounts[currentAccount];
    const container = document.getElementById("history");

    if (!account || account.history.length === 0) {
        container.textContent = "Chưa có lượt chơi.";
        return;
    }

    container.innerHTML = "";

    account.history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item" + (item.payout > 0 ? " win" : "");

        const result = item.results.map(face =>
            `${faces[face].icon} ${faces[face].name}`
        ).join(" | ");

        div.innerHTML = `
            <strong>${item.time}</strong><br>
            Kết quả: ${result}<br>
            Tổng cược: ${formatNumber(item.bet)} điểm<br>
            ${
                item.payout > 0
                ? `🎉 Nhận ${formatNumber(item.payout)} điểm`
                : "❌ Không trúng"
            }
        `;

        container.appendChild(div);
    });
}

function clearSelections() {
    selectedFaces = [];
    bets = {};

    document.querySelectorAll(".choice").forEach(button => {
        button.classList.remove("selected");
        button.querySelector("small").textContent = "0 điểm";
    });

    renderSelectedBets();
}

function formatNumber(number) {
    return Number(number).toLocaleString("vi-VN");
}

function logout() {
    currentAccount = null;
    selectedFaces = [];
    bets = {};

    localStorage.removeItem("bauCuaCurrentUser");

    document.getElementById("gameScreen").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");

    showLogin();
}

window.addEventListener("load", () => {
    const savedUser = localStorage.getItem("bauCuaCurrentUser");
    const accounts = getAccounts();

    if (savedUser && accounts[savedUser]) {
        currentAccount = savedUser;
        openGame();
    }
});
