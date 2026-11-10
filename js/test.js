// 0 = グー, 1 = チョキ, 2 = パー
var names = ["グー", "チョキ", "パー"];
var icons = ["✊", "✌️", "✋"];

// プレイヤー（0 = あなた, 1 = 相手1, 2 = 相手2）
var cards = [".b", ".c", ".d"];
var playerNames = ["あなた", "相手1", "相手2"];
var avatars = ["😎", "🤖", "👾"];

// ===== ルール =====
var GOAL = 3; // 3ポイント取ったら優勝

// ===== ゲームの状態 =====
var points = [0, 0, 0]; // 3人のポイント
var active = [0, 1, 2]; // 今じゃんけんに参加している人（決勝では2人になる）
var round = 0;          // 何回戦目か
var playing = false;    // じゃんけん中かどうか（連打防止）
var gameOver = false;   // ゲームが終わったかどうか

// その手が負ける手を返す
function loseToOf(hand) {
    if (hand === 0) {
        return 2; // グーはパーに負ける
    } else if (hand === 1) {
        return 0; // チョキはグーに負ける
    } else {
        return 1; // パーはチョキに負ける
    }
}

// あなたが今のじゃんけんに参加しているか
function youAreIn() {
    return active.indexOf(0) !== -1;
}

// 手のボタンを押せる／押せないようにする
function setButtons(enabled) {
    $(".hands button").prop("disabled", !enabled);
}

// ポイント表示とゲージを更新する
function updatePoints() {
    for (var i = 0; i < 3; i++) {
        $(cards[i] + " .pt").html(points[i] + " pt");
        $(cards[i] + " .gauge-bar").css("width", (points[i] / GOAL * 100) + "%");
    }
}

// 「予選」「決勝」と回戦数を表示する
function updateStage() {
    var stage = active.length === 3 ? "予選（3人）" : "決勝（2人）";
    $(".round").html("第 " + round + " 回戦　" + stage);
    if (active.length === 2) {
        $(".round").addClass("final");
    } else {
        $(".round").removeClass("final");
    }
}

// 「+1」をカードの上にふわっと出す
function floatPoint(i) {
    var $f = $('<div class="float">+1</div>');
    $(cards[i]).append($f);
    setTimeout(function() {
        $f.remove();
    }, 1200);
}

// 履歴に1行追加する（新しいものが上）
function addLog(text) {
    $(".log").prepend("<li>" + text + "</li>");
    if ($(".log li").length > 8) {
        $(".log li").last().remove();
    }
}

// ボタンを押したとき
function janken(me) {
    if (playing || gameOver || !youAreIn()) {
        return;
    }
    play(me);
}

// じゃんけんを1回する（me は あなたの手。あなたが参加していないときは使わない）
function play(me) {
    playing = true;
    setButtons(false);

    // 新しい回戦のはじまり（3人そろっているとき）
    if (active.length === 3) {
        $(".player").removeClass("out");
    }
    updateStage();

    // 参加している人の手を決める
    var hands = [null, null, null];
    for (var i = 0; i < active.length; i++) {
        var p = active[i];
        if (p === 0) {
            hands[p] = me;
        } else {
            hands[p] = Math.floor(Math.random() * 3); // 相手はランダム
        }
    }
    console.log("参加者：" + active.join(","), "手：", hands);

    // 参加している人だけ、グーで手をふる
    for (var j = 0; j < active.length; j++) {
        var c = cards[active[j]];
        $(c).removeClass("win lose draw");
        $(c + " .badge").html("");
        $(c + " .hand-name").html("…");
        $(c + " .hand").html("✊").removeClass("pop").addClass("shake");
    }

    // じゃん → けん → ぽん！（あいこの後は「あいこで → しょ！」）
    var again = $(".a").hasClass("aiko");
    $(".a").removeClass("aiko");
    $(".a").html(again ? "あいこで" : "じゃん");
    setTimeout(function() {
        $(".a").html(again ? "…" : "けん");
    }, 500);
    setTimeout(function() {
        $(".a").html(again ? "しょ！" : "ぽん！");
        show(hands);
    }, 1000);
}

// 手を見せて、勝ち負けを判定する
function show(hands) {
    // 参加している人の手を表示して、出た手を集める
    var used = [];
    for (var i = 0; i < active.length; i++) {
        var p = active[i];
        $(cards[p] + " .hand").html(icons[hands[p]]).removeClass("shake").addClass("pop");
        $(cards[p] + " .hand-name").html(names[hands[p]]);
        if (used.indexOf(hands[p]) === -1) {
            used.push(hands[p]);
        }
    }

    // 出た手が1種類（全員同じ）か3種類（全部バラバラ）ならあいこ
    var isDraw = used.length === 1 || used.length === 3;

    // 勝った人を集める（自分が負ける手を誰も出していなければ勝ち）
    var winners = [];
    if (!isDraw) {
        for (var j = 0; j < active.length; j++) {
            var q = active[j];
            if (used.indexOf(loseToOf(hands[q])) === -1) {
                winners.push(q);
            }
        }
    }

    // 履歴用の手の文字（例：😎✊ 🤖✌️ 👾✌️）
    var handText = "";
    for (var k = 0; k < active.length; k++) {
        handText += avatars[active[k]] + icons[hands[active[k]]] + " ";
    }

    setTimeout(function() {
        if (isDraw) {
            onDraw();
        } else if (winners.length === 2) {
            onFinal(winners, handText);
        } else {
            onWinner(winners[0], handText);
        }
    }, 600);
}

// あいこ → 同じメンバーでもう一度
function onDraw() {
    for (var i = 0; i < active.length; i++) {
        $(cards[active[i]]).addClass("draw");
        $(cards[active[i]] + " .badge").html("あいこ");
    }
    $(".a").html("あいこ！").addClass("aiko");
    next();
}

// 勝ちが2人 → 負けた1人は敗退して、2人で決勝
function onFinal(winners, handText) {
    for (var i = 0; i < active.length; i++) {
        var p = active[i];
        if (winners.indexOf(p) !== -1) {
            $(cards[p]).addClass("win");
            $(cards[p] + " .badge").html("決勝へ");
        } else {
            $(cards[p]).addClass("lose out");
            $(cards[p] + " .badge").html("敗退");
        }
    }
    addLog("第" + round + "回 " + handText + "→ " + playerNames[winners[0]] + " と " + playerNames[winners[1]] + " で決勝");

    active = winners;
    $(".a").html("決勝！");
    updateStage();
    next();
}

// 勝者が1人に決まった → +1ポイント
function onWinner(winner, handText) {
    for (var i = 0; i < active.length; i++) {
        var p = active[i];
        if (p === winner) {
            $(cards[p]).addClass("win");
            $(cards[p] + " .badge").html("WIN +1");
        } else {
            $(cards[p]).addClass("lose");
            $(cards[p] + " .badge").html("LOSE");
        }
    }
    points[winner] = points[winner] + 1;
    floatPoint(winner);
    updatePoints();

    if (winner === 0) {
        $(".a").html("あなたの勝ち！");
    } else {
        $(".a").html(playerNames[winner] + "の勝ち");
    }
    addLog("第" + round + "回 " + handText + "→ <b>" + playerNames[winner] + " +1</b>");

    // 3ポイント取ったら優勝
    if (points[winner] >= GOAL) {
        gameOver = true;
        setTimeout(function() {
            showResult(winner);
        }, 1000);
        return;
    }

    // 次の回戦は3人そろって
    active = [0, 1, 2];
    round = round + 1;
    next();
}

// 次のじゃんけんの準備
function next() {
    playing = false;
    if (youAreIn()) {
        // あなたが参加している → 手を選んでもらう
        setButtons(true);
        setTimeout(function() {
            if (!playing && !gameOver && active.length === 2 && !$(".a").hasClass("aiko")) {
                $(".a").html("決勝の手を選んでね");
            }
        }, 900);
    } else {
        // あなたが敗退 → 相手同士の決勝を自動で見る
        setButtons(false);
        setTimeout(function() {
            $(".a").html("相手どうしの決勝…");
        }, 700);
        setTimeout(function() {
            play(null);
        }, 1600);
    }
}

// 結果画面を表示する
function showResult(winner) {
    if (winner === 0) {
        $(".result-icon").html("🏆");
        $(".result-title").html("あなたの優勝！");
    } else {
        $(".result-icon").html("😢");
        $(".result-title").html(playerNames[winner] + "の優勝…");
    }
    $(".result-sub").html(round + " 回戦で決着");

    // ポイントの高い順に並べる
    var order = [0, 1, 2];
    order.sort(function(x, y) {
        return points[y] - points[x];
    });

    var medals = ["🥇", "🥈", "🥉"];
    var html = "";
    var rank = 0;
    for (var i = 0; i < 3; i++) {
        // 同点なら同じ順位にする
        if (i === 0 || points[order[i]] !== points[order[i - 1]]) {
            rank = i;
        }
        var p = order[i];
        html += "<li" + (p === 0 ? ' class="me"' : "") + ">" +
            medals[rank] + " " + avatars[p] + " " + playerNames[p] +
            "<span>" + points[p] + " pt</span></li>";
    }
    $(".ranking").html(html);
    $(".overlay").addClass("show");
}

// ゲームを最初からやり直す
function resetGame() {
    points = [0, 0, 0];
    active = [0, 1, 2];
    round = 1;
    playing = false;
    gameOver = false;

    $(".player").removeClass("win lose draw out");
    $(".badge").html("");
    $(".hand").html("✊").removeClass("pop shake");
    $(".hand-name").html("－");
    $(".a").html("手を選んでね").removeClass("aiko");
    $(".log").html("");
    $(".overlay").removeClass("show");
    setButtons(true);
    updatePoints();
    updateStage();
}

$(".aa").on("click", function() {
    janken(0); // グー
});

$(".bb").on("click", function() {
    janken(1); // チョキ
});

$(".cc").on("click", function() {
    janken(2); // パー
});

$(".retry").on("click", function() {
    resetGame();
});

// 最初の表示
resetGame();
