class VisualNovelGame {
    constructor() {
        this.scenario = null;
        this.currentScene = 'start';
        this.gameState = {
            bunsekiCleared: false,
            okozukaiCleared: false,
            nazoCleared: false
        };
        this.sceneHistory = [];
        
        // DOM要素の取得
        this.elements = {
            sceneImage: document.getElementById('scene-image'),
            sceneText: document.getElementById('scene-text'),
            textBox: document.querySelector('.text-box'),
            startButton: document.getElementById('start-button'),
            nextButton: document.getElementById('next-button'),
            prevButton: document.getElementById('prev-button'),
            restartButton: document.getElementById('restart-button'),
            choiceButtons: document.getElementById('choice-buttons'),
            choiceButtonsInText: document.getElementById('choice-buttons-in-text')
        };
        
        this.init();
    }
    
    async init() {
        try {
            // シナリオデータの読み込み
            const response = await fetch('scenario.json');
            this.scenario = await response.json();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            // 初期シーンの表示
            this.displayScene(this.scenario.startScene);
            
        } catch (error) {
            console.error('シナリオデータの読み込みに失敗しました:', error);
            this.elements.sceneText.textContent = 'ゲームデータの読み込みに失敗しました。';
        }
    }
    
    setupEventListeners() {
        // スタートボタン
        this.elements.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // 次へボタン
        this.elements.nextButton.addEventListener('click', () => {
            this.nextScene();
        });
        
        // 戻るボタン
        this.elements.prevButton.addEventListener('click', () => {
            this.prevScene();
        });
        
        // 最初からボタン
        this.elements.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    displayScene(sceneId) {
        if (!this.scenario || !this.scenario.scenes[sceneId]) {
            console.error('シーンが見つかりません:', sceneId);
            return;
        }
        
        const scene = this.scenario.scenes[sceneId];
        this.currentScene = sceneId;
        
        // 画像の更新
        this.elements.sceneImage.src = `images/${scene.image}`;
        this.elements.sceneImage.alt = scene.text.substring(0, 50);
        
        // テキストの更新（フェードインアニメーション付き）
        this.elements.sceneText.classList.remove('fade-in');
        setTimeout(() => {
            this.elements.sceneText.textContent = scene.text;
            this.elements.sceneText.classList.add('fade-in');
        }, 100);
        
        // 特殊アクションの処理
        if (scene.action) {
            this.handleSceneAction(scene.action);
        }
        
        // ボタンの表示制御
        this.updateButtonVisibility(scene);
    }
    
    handleSceneAction(action) {
        switch (action) {
            case 'set_bunseki_cleared':
                this.gameState.bunsekiCleared = true;
                break;
            case 'set_okozukai_cleared':
                this.gameState.okozukaiCleared = true;
                break;
            case 'set_nazo_cleared':
                this.gameState.nazoCleared = true;
                break;
        }
    }
    
    updateButtonVisibility(scene) {
        // 全ボタンを非表示にする
        this.hideAllButtons();
        
        switch (scene.type) {
            case 'start':
                // スタートシーンではテキストボックスを非表示
                this.elements.textBox.style.display = 'none';
                this.elements.startButton.style.display = 'inline-block';
                break;
                
            case 'dialogue':
                // ダイアログシーンではテキストボックスを表示
                this.elements.textBox.style.display = 'flex';
                
                // CHECK_SHUGYO_CLEARの特殊処理
                if (scene.next === 'CHECK_SHUGYO_CLEAR') {
                    if (this.gameState.bunsekiCleared && this.gameState.okozukaiCleared && this.gameState.nazoCleared) {
                        // 3つすべての修行をクリアしていれば次の章へ
                        this.currentScene = 'c4_1';
                        setTimeout(() => this.displayScene('c4_1'), 500);
                        return;
                    } else {
                        // いずれかが未クリアなら修行選択に戻る
                        setTimeout(() => this.displayScene('c3_choice'), 500);
                        return;
                    }
                }
                
                this.elements.nextButton.style.display = 'inline-block';
                if (scene.prev) {
                    this.elements.prevButton.style.display = 'inline-block';
                }
                break;
                
            case 'choice':
                // 選択肢シーンではテキストボックスを表示
                this.elements.textBox.style.display = 'flex';
                
                // c3_choiceで全修行完了している場合は次へボタンを表示
                if (this.currentScene === 'c3_choice' && 
                    this.gameState.bunsekiCleared && 
                    this.gameState.okozukaiCleared && 
                    this.gameState.nazoCleared) {
                    // テキストを修行完了メッセージに変更
                    this.elements.sceneText.textContent = "「素晴らしい！3つの修行をすべてやり遂げたな。分析力、努力、そして体力……。これでキミは本当に強くなった。さあ、次の段階に進もう！」\nれんとんが満足そうに笑っている。";
                    this.elements.nextButton.style.display = 'inline-block';
                    if (scene.prev) {
                        this.elements.prevButton.style.display = 'inline-block';
                    }
                } else {
                    this.createChoiceButtons(scene.choices);
                    if (scene.prev) {
                        this.elements.prevButton.style.display = 'inline-block';
                    }
                }
                break;
                
            case 'ending':
                // エンディングシーンではテキストボックスを表示
                this.elements.textBox.style.display = 'flex';
                this.elements.restartButton.style.display = 'inline-block';
                break;
        }
    }
    
    createChoiceButtons(choices) {
        // 既存の選択肢ボタンをクリア
        this.elements.choiceButtons.innerHTML = '';
        this.elements.choiceButtonsInText.innerHTML = '';
        
        // テキストを非表示にして選択肢をテキストボックス内に表示
        this.elements.sceneText.style.display = 'none';
        
        // c3_choiceシーンの場合、クリア済みの修行は表示しない
        let filteredChoices = choices;
        if (this.currentScene === 'c3_choice') {
            filteredChoices = choices.filter(choice => {
                if (choice.next === 's_bunseki_1' && this.gameState.bunsekiCleared) return false;
                if (choice.next === 's_okozukai_1' && this.gameState.okozukaiCleared) return false;
                if (choice.next === 's_nazo_1' && this.gameState.nazoCleared) return false;
                return true;
            });
        }
        
        filteredChoices.forEach((choice) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                this.selectChoice(choice.next);
            });
            this.elements.choiceButtonsInText.appendChild(button);
        });
        
        this.elements.choiceButtonsInText.style.display = 'flex';
    }
    
    hideAllButtons() {
        this.elements.startButton.style.display = 'none';
        this.elements.nextButton.style.display = 'none';
        this.elements.prevButton.style.display = 'none';
        this.elements.restartButton.style.display = 'none';
        this.elements.choiceButtons.style.display = 'none';
        this.elements.choiceButtonsInText.style.display = 'none';
        
        // テキストを再表示
        this.elements.sceneText.style.display = 'block';
    }
    
    startGame() {
        this.sceneHistory = [];
        this.addToHistory(this.currentScene);
        this.displayScene('c1_1');
    }
    
    nextScene() {
        const scene = this.scenario.scenes[this.currentScene];
        if (scene && scene.next) {
            this.addToHistory(this.currentScene);
            this.displayScene(scene.next);
        }
    }
    
    prevScene() {
        const scene = this.scenario.scenes[this.currentScene];
        if (scene && scene.prev) {
            this.displayScene(scene.prev);
        } else if (this.sceneHistory.length > 0) {
            // 履歴から前のシーンを取得
            const prevScene = this.sceneHistory.pop();
            this.displayScene(prevScene);
        }
    }
    
    selectChoice(nextSceneId) {
        this.addToHistory(this.currentScene);
        this.displayScene(nextSceneId);
    }
    
    addToHistory(sceneId) {
        this.sceneHistory.push(sceneId);
        // 履歴が長くなりすぎないよう制限
        if (this.sceneHistory.length > 50) {
            this.sceneHistory.shift();
        }
    }
    
    restartGame() {
        // ゲーム状態をリセット
        this.gameState = {
            bunsekiCleared: false,
            okozukaiCleared: false,
            nazoCleared: false
        };
        this.sceneHistory = [];
        this.displayScene(this.scenario.startScene);
    }
}

// ページ読み込み完了後にゲームを開始
document.addEventListener('DOMContentLoaded', () => {
    new VisualNovelGame();
});