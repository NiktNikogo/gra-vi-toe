class Room {
    constructor(id, playerCount, timeout) {
        this.id = id;
        this.playerCount = playerCount;
        this.timeout = timeout;
        this.turn = 0;
        this.xGrid = '000000000000000000000000000';
        this.oGrid = '000000000000000000000000000';
        this.dGrid = '000000000000000000000000000';
        this.winnningStates = [
            parseInt('111000000', 2), parseInt('000111000', 2), parseInt('000000111', 2),
            parseInt('100100100', 2), parseInt('010010010', 2), parseInt('001001001', 2),
            parseInt('100010001', 2), parseInt('001010100', 2)
        ];
    }
    mapToReadable(grid) {
        let res = '';
        const chars = '123456789abcdefghiABCDEFGHI';
        for(let i = 0; i < 27; i++) {
            if(grid[i] == '0') {
                res += '0';
            } else {
                res += chars[i];
            }
        }
        return res;
    }
    getSide(side, grid) {
        let _side = '';
        switch(side) {
            case 0: // back
                return grid.substring(0, 9);
            break;
            case 1: // front
                return grid.substring(18, 27);
            break;
            case 2: // botttom
                return grid.substring(0, 3) + grid.substring(9, 12) + grid.substring(18, 21);
            break
            case 3: // top
                return grid.substring(6, 9) + grid.substring(15, 18) + grid.substring(24, 27);
            break;
            case 4: //right
                _side = '';
                for(let i = 0; i < 9; i++) {
                    _side += grid[ (i + 1) * 3 - 1 ];
                }
                return _side;
            break;
            case 5: // right
                _side = '';
                for(let i = 0; i < 9; i++ ) {
                    _side += grid[ i * 3];
                }
                return _side;
            break;
            default:
                return '';
            break;
        }
    }
    isFull() {
        const board = (parseInt(this.xGrid, 2) ^ parseInt(this.oGrid, 2) ^ parseInt(this.dGrid, 2))
        return (board == parseInt('111111111111111111111111111', 2)) ||
            (board == parseInt('111111111111101111111111111', 2));
    }
    checkForWinning(grid) {
        let won = false;
        const chars ='123456789abcdefghiABCDEFGHI';
        for(let i = 0; i < 6; i++) {
            const playerGridToNum = parseInt(this.getSide(i, grid), 2);    
            this.winnningStates.forEach(state => {
                if((playerGridToNum & state^ state) == 0) {
                    won = true;
                }
            });
        }
       
        return won;
    }
    checkState() {
        let winningStatus = 0;
        let xWin = this.checkForWinning(this.xGrid);
        let oWin = this.checkForWinning(this.oGrid);
        let dWin = this.checkForWinning(this.dGrid);
        let full = this.isFull();
        if(xWin== false && oWin == false && dWin == false && full == true) {
            winningStatus = 4;
        } else if(dWin == true) {
            winningStatus = 3;
        } else if(xWin == true) {
            winningStatus = 2;
        } else if(oWin == true) {
            winningStatus = 1;
        }
        return winningStatus;
    }
    setTile(data, replace) {
        let index = data.move[0] + data.move[1] * 3 + data.move[2] * 9;
        if(this.turn == 0) {
            this.oGrid = replace(this.oGrid, index, '1');
        } else if(this.turn == 1){
            this.xGrid = replace(this.xGrid, index, '1');
        } else {
            this.dGrid = replace(this.dGrid, index, '1');
        }
    }
    printRoomInfo() {
        console.log(`id: ${this.id}, timeout: ${this.timeout}, playercount: ${this.playerCount}`);
    }
    boardState() {
        let state = '';
        for(let i = 0; i < 27; i++ ){
            if(this.oGrid[i] == '1') {
                state += '1';
            } else if(this.xGrid[i] == '1') {
                state += '2';
            } else if(this.dGrid[i] == '1') {
                state += '3'; 
            } else {
                state += '0';
            }
        }
        return state;
    }
};
module.exports = Room;