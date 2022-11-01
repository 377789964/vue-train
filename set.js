 new Set(['a'])
 s.forEach(item => {
    s.delete(item)
    s.add(item)
 });

// 使用同一个地址