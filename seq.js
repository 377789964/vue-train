// 最长递增子序列
// 最优的情况 [1,2,3,4,5,6] -> [0,1,2,3,4,5]

function getSequence(arr) {
    let len = arr.length; // 总长度
    let result = [0]; // 默认连续的最终结果 组成的索引 
    let resultLastIndex;
    let start;
    let end;
    let middle;
    let p = arr.slice(0); // 用来标识索引的
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        // vue中如果序列中出现0 忽略就可以， vue中序列不会出现0
        if(arrI !== 0) {
            resultLastIndex = result[result.length - 1]
            if(arr[resultLastIndex] < arrI) {
                result.push(i)
                p[i]  = resultLastIndex // 让当前最后一项记住前一项的索引
                continue
            }
            // 这里会出现 当前项比最后一项的值大
            start = 0;
            end = result.length - 1
            while(start < end) {
                middle = (start + end) / 2 | 0
                if(arr[result[middle]] < arrI) {
                    start = middle + 1
                } else {
                    end = middle
                }
            }
            // middle 就是第一个比当前值大的值
            if (arrI < arr[result[start]]) {
                p[i] = result[start - 1] // 记住换的那个人的前一项的索引
                result[start] = i
            }
        }
    }
    // 追溯
    let i = result.length // 获取数组长度
    let last = result[i - 1] // 最后一项的索引
    while (i-- > 0) { 
        result[i] = last // 用最后一项索引的来追溯源
        last = p[last] // 用p中的索引来进行追溯
    }
    return result
}

// const result = getSequence([1,2,3,4,5,6])
// const result = getSequence([2,5,8,4,6,7,9,3])
const result = getSequence([2, 3, 1, 5, 6, 7, 8, 9, 4])
// 2 3 6 7 9
// 0 7 4 5 6
console.log(result, 'result')

// 求最长递增子序列的个数 先求个数？

// 1. 看最新的和尾部的最后一项的关系，如果比他大直接放到后面
// 2. 去列表中查找 比当前项大的 做替换

// 2 5 8 4 6 7 9 3

// 2
// 2 5
// 2 5 8
// 2 4 8
// 2 4 6
// 2 4 6 7
// 2 4 6 7 9
// 2 3 6 7 9 个数ok 这个可以通过前驱节点来进行修复操作

// 采用直线二分查找 + 贪心算法

// 3 4 5 9 7 6 2 1 8 11
// 3
// 3 4
// 3 4 5
// 3 4 5 9
// 3 4 5 7
// 3 4 5 6
// 2 4 5 6
// 1 4 5 6
// 1 4 5 8
// 1 4 5 8 11
