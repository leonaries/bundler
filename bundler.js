const fs = require('fs') //node 读取文件
const path = require('path') //读取路径
const parser = require('@babel/parser') //分析源代码
const traverse = require('@babel/traverse').default //遍历抽象语法树获取引入声明
const babel = require('@babel/core') //babel的核心模块
    //模块分析
const moduleAnaylyer = (filename) => {
        const content = fs.readFileSync(filename, 'utf-8')
            //分析源代码中 ES module语法 形成抽象语法树 从 body中中取出引入声明 type类型 ：ImportDeclaration
        const ast = parser.parse(content, {
            sourceType: 'module' //语法类型
        })
        const dependencies = {} //存储依赖关系
            //通过babel traverse 遍历抽象语法树获得引入声明 ImportDeclaration
        traverse(ast, {
                ImportDeclaration({ node }) {
                    const dirname = path.dirname(filename) //获取当前文件所在根路径 文件夹名称
                    const newFile = './' + path.join(dirname, node.source.value) //将当前文件所在目录名和文件中引用的相对路径  拼接成为 根路径下的绝对路径
                    dependencies[node.source.value] = newFile
                }
            })
            //通过babel的核心模块将ast转化为浏览器能够运行的语法
        const { code } = babel.transformFromAst(ast, null, {
            presets: ["@babel/preset-env"]
        })
        return {
            filename,
            dependencies,
            code
        }

    }
    // const moduleInfo = moduleAnaylyer('./src/index.js')


//依赖拓扑
const makeDependeniesGraph = (entry) => {
    const entryModule = moduleAnaylyer(entry)
    const graphArray = [entryModule]
    for (let i = 0; i < graphArray.length; i++) {
        const item = graphArray[i]
        const { dependencies } = item
        if (dependencies) {
            for (let j in dependencies) {
                graphArray.push(
                    moduleAnaylyer(dependencies[j])
                )
            }
        }
    }
    const graph = {}
    graphArray.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    })
    return graph
}

const graph = makeDependeniesGraph('./src/index.js')
console.log(graph)