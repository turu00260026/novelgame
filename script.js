// ゲーム状態管理
class GameState {
    constructor() {
        this.currentScene = '';
        this.history = [];
        this.flags = {
            bunseki_cleared: false,
            okozukai_cleared: false,
            nazo_cleared: false
        };
        this.scenario = null;
    }

    // フラグをセット
    setFlag(flagName, value = true) {
        this.flags[flagName] = value;
    }

    // フラグを取得
    getFlag(flagName) {
        return this.flags[flagName] || false;
    }

    // 修行がすべてクリアされているかチェック
    isAllShugyoCleared() {
        return this.flags.bunseki_cleared && this.flags.okozukai_cleared && this.flags.nazo_cleared;
    }

    // 履歴に追加
    addToHistory(sceneId) {
        this.history.push(sceneId);
    }

    // 前のシーンを取得
    getPreviousScene() {
        if (this.history.length >= 2) {
            return this.history[this.history.length - 2];
        }
        return null;
    }

    // ゲーム状態をリセット
    reset() {
        this.currentScene = '';
        this.history = [];
        this.flags = {
            bunseki_cleared: false,
            okozukai_cleared: false,
            nazo_cleared: false
        };
    }
}

// ゲームコントローラー
class VisualNovelGame {
    constructor() {
        this.gameState = new GameState();
        this.elements = {};
        this.init();
    }

    // 初期化
    async init() {
        this.setupElements();
        await this.loadScenario();
        this.setupEventListeners();
        
        // スタートボタンを初期状態で表示
        if (this.elements.startButtonContainer) {
            this.elements.startButtonContainer.style.cssText = 'display: flex !important; position: fixed !important; bottom: 50px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1000 !important; visibility: visible !important;';
            this.elements.startButtonContainer.classList.add('active');
            console.log('初期化時にスタートボタンを表示');
        }
        
        this.showStartScreen();
    }

    // DOM要素を取得
    setupElements() {
        this.elements = {
            sceneImage: document.getElementById('sceneImage'),
            storyText: document.getElementById('storyText'),
            textBox: document.getElementById('textBox'),
            navigationButtons: document.getElementById('navigationButtons'),
            startButtonContainer: document.getElementById('startButtonContainer'),
            choiceButtons: document.getElementById('choiceButtons'),
            endingButtonContainer: document.getElementById('endingButtonContainer'),
            prevButton: document.getElementById('prevButton'),
            nextButton: document.getElementById('nextButton'),
            startButton: document.getElementById('startButton'),
            restartButton: document.getElementById('restartButton')
        };
    }

    // シナリオデータを読み込み
    async loadScenario() {
        try {
            const response = await fetch('scenario.json');
            this.gameState.scenario = await response.json();
        } catch (error) {
            console.error('シナリオファイルの読み込みに失敗しました:', error);
            alert('ゲームデータの読み込みに失敗しました。');
        }
    }

    // イベントリスナーを設定
    setupEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.nextButton.addEventListener('click', () => this.nextScene());
        this.elements.prevButton.addEventListener('click', () => this.prevScene());
        this.elements.restartButton.addEventListener('click', () => this.restart());
    }

    // スタート画面を表示
    showStartScreen() {
        this.gameState.currentScene = 'start';
        document.getElementById('gameContainer').classList.add('start-mode');
        this.displayScene('start');
        this.showButtons('start');
        
        // デバッグ用：スタートボタンを強制表示
        setTimeout(() => {
            const startBtn = document.getElementById('startButtonContainer');
            if (startBtn) {
                startBtn.style.cssText = 'display: flex !important; position: fixed !important; bottom: 50px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1000 !important; visibility: visible !important;';
                startBtn.classList.remove('hidden');
                startBtn.classList.add('active');
                console.log('スタートボタンを強制表示しました', startBtn);
            }
        }, 100);
    }

    // ゲーム開始
    startGame() {
        this.gameState.reset();
        document.getElementById('gameContainer').classList.remove('start-mode');
        this.moveToScene('c1_1');
    }

    // シーンに移動
    moveToScene(sceneId) {
        // 特殊な処理が必要なシーンIDをチェック
        if (sceneId === 'CHECK_SHUGYO_CLEAR') {
            this.handleShugyoCheck();
            return;
        }

        const scene = this.gameState.scenario.scenes[sceneId];
        if (!scene) {
            console.error('シーンが見つかりません:', sceneId);
            return;
        }

        // 現在のシーンを履歴に追加
        if (this.gameState.currentScene) {
            this.gameState.addToHistory(this.gameState.currentScene);
        }

        this.gameState.currentScene = sceneId;
        this.displayScene(sceneId);

        // アクションが設定されている場合は実行
        if (scene.action) {
            this.executeAction(scene.action);
        }
    }

    // シーンを表示
    displayScene(sceneId) {
        const scene = this.gameState.scenario.scenes[sceneId];
        if (!scene) return;

        // 画像を更新
        this.updateImage(scene.image);

        // テキストを更新
        this.updateText(scene.text);

        // ボタンを表示
        this.showButtons(scene.type, scene);
    }

    // 画像を更新
    updateImage(imagePath) {
        this.elements.sceneImage.src = 'images/' + imagePath;
        this.elements.sceneImage.alt = 'シーン画像';
    }

    // テキストを更新
    updateText(text) {
        this.elements.storyText.textContent = text;
    }

    // ボタンを表示
    showButtons(type, scene = null) {
        switch (type) {
            case 'start':
                // すべてのボタンコンテナを非表示（スタートボタン以外）
                this.elements.navigationButtons.classList.remove('active');
                this.elements.navigationButtons.style.cssText = 'display: none !important;';
                this.elements.choiceButtons.classList.remove('active');
                this.elements.choiceButtons.style.cssText = 'display: none !important;';
                this.elements.endingButtonContainer.classList.remove('active');
                this.elements.endingButtonContainer.style.cssText = 'display: none !important;';
                
                // スタート画面ではテキストボックスを非表示
                this.elements.textBox.style.visibility = 'hidden';
                // スタートボタンを確実に表示
                this.elements.startButtonContainer.classList.remove('hidden');
                this.elements.startButtonContainer.classList.add('active');
                this.elements.startButtonContainer.style.cssText = 'display: flex !important; position: fixed !important; bottom: 50px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1000 !important; visibility: visible !important;';
                console.log('スタートボタンを表示しました');
                break;

            case 'dialogue':
                // 他のボタンコンテナを非表示
                this.elements.startButtonContainer.classList.remove('active');
                this.elements.startButtonContainer.classList.add('hidden');
                this.elements.startButtonContainer.style.cssText = 'display: none !important;';
                this.elements.choiceButtons.classList.remove('active');
                this.elements.choiceButtons.style.cssText = 'display: none !important;';
                this.elements.endingButtonContainer.classList.remove('active');
                this.elements.endingButtonContainer.style.cssText = 'display: none !important;';
                
                // 通常のシーンではテキストボックスを表示
                this.elements.textBox.style.visibility = 'visible';
                
                // ナビゲーションボタンを確実に表示
                this.elements.navigationButtons.classList.add('active');
                this.elements.navigationButtons.style.cssText = 'display: flex !important; justify-content: space-between !important; width: 100% !important; max-width: 800px !important; margin: 0 auto !important; padding: 10px 0 !important;';
                
                // 個別ボタンも確実に表示
                if (this.elements.prevButton) {
                    this.elements.prevButton.style.display = 'block';
                }
                if (this.elements.nextButton) {
                    this.elements.nextButton.style.display = 'block';
                }
                
                this.updateNavigationButtons(scene);
                console.log('ナビゲーションボタンを表示しました');
                break;

            case 'choice':
                // 他のボタンコンテナを非表示
                this.elements.startButtonContainer.classList.remove('active');
                this.elements.startButtonContainer.classList.add('hidden');
                this.elements.startButtonContainer.style.cssText = 'display: none !important;';
                this.elements.navigationButtons.classList.remove('active');
                this.elements.navigationButtons.style.cssText = 'display: none !important;';
                this.elements.endingButtonContainer.classList.remove('active');
                this.elements.endingButtonContainer.style.cssText = 'display: none !important;';
                
                // 選択肢シーンではテキストボックスを表示
                this.elements.textBox.style.visibility = 'visible';
                this.setupChoiceButtons(scene.choices);
                this.elements.choiceButtons.classList.add('active');
                this.elements.choiceButtons.style.cssText = 'display: flex !important;';
                
                // 修行選択画面で全修行完了済みの場合のみ、ナビゲーションボタンを表示
                if (this.gameState.currentScene === 'c3_choice' && this.gameState.isAllShugyoCleared()) {
                    this.elements.navigationButtons.classList.add('active');
                    this.elements.navigationButtons.style.cssText = 'display: flex !important; justify-content: space-between !important; width: 100% !important; max-width: 800px !important; margin: 0 auto !important; padding: 10px 0 !important;';
                    this.updateNavigationButtons(scene);
                }
                break;

            case 'ending':
                // 他のボタンコンテナを非表示
                this.elements.startButtonContainer.classList.remove('active');
                this.elements.startButtonContainer.classList.add('hidden');
                this.elements.startButtonContainer.style.cssText = 'display: none !important;';
                this.elements.navigationButtons.classList.remove('active');
                this.elements.navigationButtons.style.cssText = 'display: none !important;';
                this.elements.choiceButtons.classList.remove('active');
                this.elements.choiceButtons.style.cssText = 'display: none !important;';
                
                // エンディングシーンではテキストボックスを表示
                this.elements.textBox.style.visibility = 'visible';
                this.elements.endingButtonContainer.classList.add('active');
                this.elements.endingButtonContainer.style.cssText = 'display: flex !important;';
                break;
        }
    }

    // すべてのボタンコンテナを非表示
    hideAllButtons() {
        const containers = [
            this.elements.navigationButtons,
            this.elements.startButtonContainer,
            this.elements.choiceButtons,
            this.elements.endingButtonContainer
        ];

        containers.forEach(container => {
            container.classList.remove('active');
        });
    }

    // ナビゲーションボタンの状態を更新
    updateNavigationButtons(scene) {
        // 戻るボタンの状態
        this.elements.prevButton.disabled = !scene.prev;

        // 次へボタンの状態
        this.elements.nextButton.disabled = !scene.next;
    }

    // 選択肢ボタンを設定
    setupChoiceButtons(choices) {
        // 既存の選択肢ボタンをクリア
        this.elements.choiceButtons.innerHTML = '';

        choices.forEach((choice) => {
            // 修行選択の場合、完了済みの修行は表示しない
            if (this.shouldSkipChoice(choice)) {
                return;
            }

            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                this.selectChoice(choice.next);
            });
            this.elements.choiceButtons.appendChild(button);
        });
    }

    // 選択肢をスキップするかどうかを判定
    shouldSkipChoice(choice) {
        // 分析の修行が完了している場合、分析の選択肢をスキップ
        if (choice.next === 's_bunseki_1' && this.gameState.getFlag('bunseki_cleared')) {
            return true;
        }

        // お小遣いの修行が完了している場合、お小遣いの選択肢をスキップ
        if (choice.next === 's_okozukai_1' && this.gameState.getFlag('okozukai_cleared')) {
            return true;
        }

        // 謎の修行が完了している場合、謎の選択肢をスキップ
        if (choice.next === 's_nazo_1' && this.gameState.getFlag('nazo_cleared')) {
            return true;
        }

        return false;
    }

    // 選択肢を選択
    selectChoice(nextSceneId) {
        this.moveToScene(nextSceneId);
    }

    // 次のシーンに進む
    nextScene() {
        const currentScene = this.gameState.scenario.scenes[this.gameState.currentScene];
        if (currentScene && currentScene.next) {
            this.moveToScene(currentScene.next);
        }
    }

    // 前のシーンに戻る
    prevScene() {
        const currentScene = this.gameState.scenario.scenes[this.gameState.currentScene];
        if (currentScene && currentScene.prev) {
            this.moveToScene(currentScene.prev);
        }
    }

    // アクションを実行
    executeAction(action) {
        switch (action) {
            case 'set_bunseki_cleared':
                this.gameState.setFlag('bunseki_cleared', true);
                break;

            case 'set_okozukai_cleared':
                this.gameState.setFlag('okozukai_cleared', true);
                break;

            case 'set_nazo_cleared':
                this.gameState.setFlag('nazo_cleared', true);
                break;
        }
    }

    // 修行チェック処理
    handleShugyoCheck() {
        if (this.gameState.isAllShugyoCleared()) {
            // すべての修行がクリアされている場合、次の章へ
            this.moveToScene('c4_1');
        } else {
            // まだクリアされていない修行がある場合、選択画面に戻る
            this.moveToScene('c3_choice');
        }
    }

    // ゲームを最初から開始
    restart() {
        this.gameState.reset();
        document.getElementById('gameContainer').classList.add('start-mode');
        
        // スタートボタンを確実に表示
        if (this.elements.startButtonContainer) {
            this.elements.startButtonContainer.style.cssText = 'display: flex !important; position: fixed !important; bottom: 50px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1000 !important; visibility: visible !important;';
            this.elements.startButtonContainer.classList.remove('hidden');
            this.elements.startButtonContainer.classList.add('active');
            console.log('リスタート時にスタートボタンを表示');
        }
        
        this.showStartScreen();
    }
}

// ページ読み込み完了後にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new VisualNovelGame();
});