// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Game variables
    const gridSize = 4;
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('2048-best-score') || 0;
    let specialCount = localStorage.getItem('2048-special-count') || 0;
    let gameOver = false;
    let canMove = true;
    let lastPositions = [];
    let mergedPositions = [];
    let removedPositions = [];
    let tilesToRemove = [];
    let showImages = true; // 默认显示头像

    // 获取音频元素
    const moveSound = document.getElementById('moveSound');
    const vanishSound = document.getElementById('vanishSound');
    const z52Sound = document.getElementById('z52Sound');

    // 切换按钮事件
    const toggleButton = document.getElementById('toggle-display');
    const toggleText = document.getElementById('toggle-text');
    toggleButton.addEventListener('click', () => {
        showImages = !showImages;
        if (showImages) {
            toggleText.textContent = '显示数字';
        } else {
            toggleText.textContent = '显示头像';
        }
        renderGrid();
    });

    // 其他代码保持不变...
    const allowedNumbers = [1, 2, 4, 8, 9, 11, 16, 18, 19, 20, 21, 23, 24, 25, 26, 28, 35, 36, 43, 46, 47, 52];
    const specialNumbers = [46, 47, 52];
    const mergeRules = {
        2: [[1, 1]],
        4: [[2, 2]],
        8: [[4, 4]],
        16: [[8, 8]],
        9: [[1, 8]],
        11: [[2, 9]],
        18: [[2, 16], [9, 9]],
        19: [[1, 18], [8, 11]],
        20: [[1, 19], [2, 18], [4, 16], [9, 11]],
        21: [[1, 20], [2, 19]],
        23: [[2, 21], [4, 19]],
        24: [[1, 23], [4, 20], [8, 16]],
        25: [[2, 23], [9, 16]],
        26: [[1, 25], [2, 24], [8, 18]],
        28: [[2, 26], [4, 24], [8, 20], [9, 19]],
        35: [[9, 26], [11, 24], [16, 19]],
        36: [[1, 35], [8, 28], [11, 25], [16, 20], [18, 18]],
        43: [[8, 35], [18, 25], [19, 24], [20, 23]],
        46: [[11, 35], [18, 28], [23, 23]],
        47: [[1, 46], [4, 43], [11, 36], [19, 28], [21, 26], [23, 24]],
        52: [[9, 43], [16, 36], [24, 28], [26, 26]],
    };

    const gridContainer = document.getElementById('grid-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const specialCountElement = document.getElementById('special-count');
    const newGameButton = document.getElementById('new-game');
    const gameMessage = document.getElementById('game-message');
    const gameMessageText = document.getElementById('game-message-text');
    const gameMessageButton = document.getElementById('game-message-button');

    bestScoreElement.textContent = bestScore;
    specialCountElement.textContent = specialCount;

    function initGame() {
        grid = createEmptyGrid();
        score = 0;
        gameOver = false;
        canMove = true;
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
        tilesToRemove = [];
        scoreElement.textContent = score;
        gameMessage.classList.add('hidden');
        addRandomTile();
        addRandomTile();
        renderGrid();
    }

    function createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }

    function addRandomTile() {
        if (!hasEmptyCell()) return false;
        let emptyCells = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push({ x: i, y: j });
                }
            }
        }
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const rand = Math.random();
        const value = rand < 0.8 ? 1 : (rand < 0.95 ? 2 : 4);
        grid[randomCell.x][randomCell.y] = value;
        return true;
    }

    function hasEmptyCell() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function getMergeResult(num1, num2) {
        for (const [result, pairs] of Object.entries(mergeRules)) {
            const resultNum = parseInt(result);
            for (const [a, b] of pairs) {
                if ((num1 === a && num2 === b) || (num1 === b && num2 === a)) {
                    if (allowedNumbers.includes(resultNum)) {
                        return resultNum;
                    }
                }
            }
        }
        return null;
    }

    function isSpecialNumber(number) {
        return specialNumbers.includes(number);
    }

    function handleSpecialMerge(number, x, y) {
        if (isSpecialNumber(number)) {
            let points = 0;
            if (number === 46) points = 460;
            else if (number === 47) points = 470;
            else if (number === 52) points = 520;
            score += points;
            tilesToRemove.push({ x, y, number, timeoutId: null });
            if (number === 52) {
                specialCount++;
                specialCountElement.textContent = specialCount;
                localStorage.setItem('2048-special-count', specialCount);
                z52Sound.currentTime = 0;
                z52Sound.play();
            } else {
                vanishSound.currentTime = 0;
                vanishSound.play();
            }
            return true;
        }
        return false;
    }

    function processTilesToRemove() {
        tilesToRemove.forEach(tile => {
            removedPositions.push({ x: tile.x, y: tile.y, number: tile.number });
            grid[tile.x][tile.y] = 0;
        });
        tilesToRemove = [];
        renderGrid();
    }

    function renderGrid() {
        gridContainer.innerHTML = '';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ease-out';

                const isNewTile = lastPositions.some(pos => pos.fromX === i && pos.fromY === j) ||
                    mergedPositions.some(pos => pos.x === i && pos.y === j);

                const isMergedTile = mergedPositions.some(pos => pos.x === i && pos.y === j);
                const isRemovedTile = removedPositions.some(pos => pos.x === i && pos.y === j);
                const isSpecialTile = tilesToRemove.some(t => t.x === i && t.y === j);

                if (isNewTile) tile.classList.add('new-tile');
                if (isMergedTile) tile.classList.add('merged-tile');
                if (isRemovedTile) tile.classList.add('special-tile');
                if (isSpecialTile) tile.classList.add('tile-flash');

                if (grid[i][j] === 0) {
                    tile.classList.add('bg-empty');
                } else {
                    const value = grid[i][j];
                    const tileClass = `tile-${value}`;
                    tile.classList.add(tileClass);

                    if (showImages) {
                        const img = document.createElement('img');
                        img.src = `avatar/${value}.jpg`;
                        img.className = 'tile-image';
                        img.alt = value;
                        img.onerror = function () {
                            this.style.display = 'none';
                            if (tile.querySelector('.tile-text')) {
                                tile.querySelector('.tile-text').style.display = 'block';
                            } else {
                                const text = document.createElement('div');
                                text.className = 'tile-text text-[clamp(1.2rem,5vw,2rem)] font-bold';
                                text.textContent = value;
                                tile.appendChild(text);
                            }
                        };
                        tile.appendChild(img);
                        const text = document.createElement('div');
                        text.className = 'tile-text text-[clamp(1.2rem,5vw,2rem)] font-bold hidden';
                        text.textContent = value;
                        tile.appendChild(text);
                    } else {
                        const text = document.createElement('div');
                        text.className = 'tile-text text-[clamp(1.2rem,5vw,2rem)] font-bold';
                        text.textContent = value;
                        tile.appendChild(text);
                    }
                }

                const lastPos = lastPositions.find(pos => pos.toX === i && pos.toY === j);
                if (lastPos) {
                    const dx = (lastPos.fromX - i) * 100;
                    const dy = (lastPos.fromY - j) * 100;
                    tile.style.transform = `translate(${dy}%, ${dx}%)`;
                    setTimeout(() => {
                        tile.style.transform = '';
                    }, 10);
                }

                gridContainer.appendChild(tile);
            }
        }
        if (tilesToRemove.length > 0) {
            setTimeout(processTilesToRemove, 1000);
        }
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
    }

    // 移动逻辑保持不变...
    function moveUp() {
        let moved = false;
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
        tilesToRemove = [];
        for (let j = 0; j < gridSize; j++) {
            for (let i = 1; i < gridSize; i++) {
                if (grid[i][j] !== 0) {
                    let newI = i;
                    const fromI = i;
                    const fromJ = j;
                    while (newI > 0 && grid[newI - 1][j] === 0) {
                        grid[newI - 1][j] = grid[newI][j];
                        grid[newI][j] = 0;
                        newI--;
                        moved = true;
                    }
                    if (newI > 0) {
                        const currentValue = grid[newI][j];
                        const aboveValue = grid[newI - 1][j];
                        const mergeResult = getMergeResult(currentValue, aboveValue);
                        if (mergeResult !== null) {
                            const isSpecial = handleSpecialMerge(mergeResult, newI - 1, j);
                            if (!isSpecial) {
                                grid[newI - 1][j] = mergeResult;
                                score += mergeResult;
                                mergedPositions.push({ x: newI - 1, y: j });
                            } else {
                                grid[newI - 1][j] = mergeResult;
                                mergedPositions.push({ x: newI - 1, y: j });
                            }
                            grid[newI][j] = 0;
                            moved = true;
                        }
                    }
                    if (fromI !== newI) {
                        lastPositions.push({
                            fromX: fromI,
                            fromY: fromJ,
                            toX: newI,
                            toY: j
                        });
                    }
                }
            }
        }
        if (moved) {
            moveSound.currentTime = 0;
            moveSound.play();
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
        tilesToRemove = [];
        for (let j = 0; j < gridSize; j++) {
            for (let i = gridSize - 2; i >= 0; i--) {
                if (grid[i][j] !== 0) {
                    let newI = i;
                    const fromI = i;
                    const fromJ = j;
                    while (newI < gridSize - 1 && grid[newI + 1][j] === 0) {
                        grid[newI + 1][j] = grid[newI][j];
                        grid[newI][j] = 0;
                        newI++;
                        moved = true;
                    }
                    if (newI < gridSize - 1) {
                        const currentValue = grid[newI][j];
                        const belowValue = grid[newI + 1][j];
                        const mergeResult = getMergeResult(currentValue, belowValue);
                        if (mergeResult !== null) {
                            const isSpecial = handleSpecialMerge(mergeResult, newI + 1, j);
                            if (!isSpecial) {
                                grid[newI + 1][j] = mergeResult;
                                score += mergeResult;
                                mergedPositions.push({ x: newI + 1, y: j });
                            } else {
                                grid[newI + 1][j] = mergeResult;
                                mergedPositions.push({ x: newI + 1, y: j });
                            }
                            grid[newI][j] = 0;
                            moved = true;
                        }
                    }
                    if (fromI !== newI) {
                        lastPositions.push({
                            fromX: fromI,
                            fromY: fromJ,
                            toX: newI,
                            toY: j
                        });
                    }
                }
            }
        }
        if (moved) {
            moveSound.currentTime = 0;
            moveSound.play();
        }
        return moved;
    }

    function moveLeft() {
        let moved = false;
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
        tilesToRemove = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 1; j < gridSize; j++) {
                if (grid[i][j] !== 0) {
                    let newJ = j;
                    const fromI = i;
                    const fromJ = j;
                    while (newJ > 0 && grid[i][newJ - 1] === 0) {
                        grid[i][newJ - 1] = grid[i][newJ];
                        grid[i][newJ] = 0;
                        newJ--;
                        moved = true;
                    }
                    if (newJ > 0) {
                        const currentValue = grid[i][newJ];
                        const leftValue = grid[i][newJ - 1];
                        const mergeResult = getMergeResult(currentValue, leftValue);
                        if (mergeResult !== null) {
                            const isSpecial = handleSpecialMerge(mergeResult, i, newJ - 1);
                            if (!isSpecial) {
                                grid[i][newJ - 1] = mergeResult;
                                score += mergeResult;
                                mergedPositions.push({ x: i, y: newJ - 1 });
                            } else {
                                grid[i][newJ - 1] = mergeResult;
                                mergedPositions.push({ x: i, y: newJ - 1 });
                            }
                            grid[i][newJ] = 0;
                            moved = true;
                        }
                    }
                    if (fromJ !== newJ) {
                        lastPositions.push({
                            fromX: fromI,
                            fromY: fromJ,
                            toX: i,
                            toY: newJ
                        });
                    }
                }
            }
        }
        if (moved) {
            moveSound.currentTime = 0;
            moveSound.play();
        }
        return moved;
    }

    function moveRight() {
        let moved = false;
        lastPositions = [];
        mergedPositions = [];
        removedPositions = [];
        tilesToRemove = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = gridSize - 2; j >= 0; j--) {
                if (grid[i][j] !== 0) {
                    let newJ = j;
                    const fromI = i;
                    const fromJ = j;
                    while (newJ < gridSize - 1 && grid[i][newJ + 1] === 0) {
                        grid[i][newJ + 1] = grid[i][newJ];
                        grid[i][newJ] = 0;
                        newJ++;
                        moved = true;
                    }
                    if (newJ < gridSize - 1) {
                        const currentValue = grid[i][newJ];
                        const rightValue = grid[i][newJ + 1];
                        const mergeResult = getMergeResult(currentValue, rightValue);
                        if (mergeResult !== null) {
                            const isSpecial = handleSpecialMerge(mergeResult, i, newJ + 1);
                            if (!isSpecial) {
                                grid[i][newJ + 1] = mergeResult;
                                score += mergeResult;
                                mergedPositions.push({ x: i, y: newJ + 1 });
                            } else {
                                grid[i][newJ + 1] = mergeResult;
                                mergedPositions.push({ x: i, y: newJ + 1 });
                            }
                            grid[i][newJ] = 0;
                            moved = true;
                        }
                    }
                    if (fromJ !== newJ) {
                        lastPositions.push({
                            fromX: fromI,
                            fromY: fromJ,
                            toX: i,
                            toY: newJ
                        });
                    }
                }
            }
        }
        if (moved) {
            moveSound.currentTime = 0;
            moveSound.play();
        }
        return moved;
    }

    function checkWin() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] >= 52) {
                    return true;
                }
            }
        }
        return false;
    }

    function checkLose() {
        if (hasEmptyCell()) return false;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (getMergeResult(grid[i][j], grid[i][j + 1]) !== null) {
                    return false;
                }
            }
        }
        for (let j = 0; j < gridSize; j++) {
            for (let i = 0; i < gridSize - 1; i++) {
                if (getMergeResult(grid[i][j], grid[i + 1][j]) !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    function handleGameState() {
        scoreElement.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('2048-best-score', bestScore);
        }
        if (checkWin()) {
            gameOver = true;
            gameMessageText.textContent = 'You Win!';
            gameMessage.classList.remove('hidden');
            return;
        }
        if (checkLose()) {
            gameOver = true;
            gameMessageText.textContent = 'Game Over!';
            gameMessage.classList.remove('hidden');
            return;
        }
    }

    function handleKeydown(e) {
        if (!canMove || gameOver) return;
        let moved = false;
        switch (e.key) {
            case 'ArrowUp':
                moved = moveUp();
                break;
            case 'ArrowDown':
                moved = moveDown();
                break;
            case 'ArrowLeft':
                moved = moveLeft();
                break;
            case 'ArrowRight':
                moved = moveRight();
                break;
            default:
                return;
        }
        if (moved) {
            canMove = false;
            renderGrid();
            const delay = tilesToRemove.length > 0 ? 1200 : 200;
            setTimeout(() => {
                addRandomTile();
                renderGrid();
                handleGameState();
                canMove = true;
            }, delay);
        }
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    function handleTouchStart(e) {
        if (!canMove || gameOver) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        if (!canMove || gameOver) return;
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 20) {
                moveRight();
            } else if (diffX < -20) {
                moveLeft();
            }
        } else {
            if (diffY > 20) {
                moveDown();
            } else if (diffY < -20) {
                moveUp();
            }
        }
        const moved = diffX > 20 || diffX < -20 || diffY > 20 || diffY < -20;
        if (moved) {
            canMove = false;
            renderGrid();
            const delay = tilesToRemove.length > 0 ? 1200 : 200;
            setTimeout(() => {
                addRandomTile();
                renderGrid();
                handleGameState();
                canMove = true;
            }, delay);
        }
    }

    // 新增代码：阻止默认滚动行为
    const gameArea = document.getElementById('game-area');
    const gameArea1 = document.getElementById('game-area1');
    let isMouseInGameArea = false;

    gameArea.addEventListener('mouseenter', () => {
        isMouseInGameArea = true;
    });

    gameArea.addEventListener('mouseleave', () => {
        isMouseInGameArea = false;
    });

    document.addEventListener('keydown', (e) => {
        if (isMouseInGameArea && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            handleKeydown(e);
        }
    });

    gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTouchStart(e);
    });

    gameArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleTouchEnd(e);
    });

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    newGameButton.addEventListener('click', initGame);
    gameMessageButton.addEventListener('click', initGame);
    initGame();
});