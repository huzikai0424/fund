import React from 'react';
import './App.css';
import ClipboardJS from 'clipboard'
class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      fundData: JSON.parse(localStorage.getItem('fund')) || [],
      showList: [],
      today: 0,
      all: 0,
      addItem: {},
      inputJson:''
    }
  }
  componentDidMount() {
    new ClipboardJS('#saveJSON')
    this.getFundDatas()
    setInterval(() => {
      this.getFundDatas()
    },2*60*1000)
  }
  getFundDatas() {
    this.setState({
      showList:[]
    })
    this.state.fundData.forEach(item => {
      this.jsonp(`http://fundgz.1234567.com.cn/js/${item.id}.js?rt=${new Date().getTime()}`)
    })
  }
  jsonp(url, jsonpCallback = 'jsonpgz') {
    const script = document.createElement('script')
    script.src = url
    script.onload = (e)=> {
      e.currentTarget.remove()
    }
    window[jsonpCallback] = data => {
      if(!data) {return}
      const { showList, fundData } = this.state
      const config = fundData.find((item) => item.id === data.fundcode)
      if (!config) {
        fundData.push({
          id: data.fundcode,
          num: 0,
          money:0
        })
      }
      showList.push(data)
      this.setState({
        showList,
        fundData
      })
    }
    document.body.appendChild(script)
  }
  ondelete(code) {
    const result = window.confirm("是否要删除该基金")
    if (result) {
      const { fundData,showList } = this.state
      const newList = fundData.filter(item => item.id !== code)
      let _showList = showList.filter(item=>item.fundcode!==code)
      this.setState({
        fundData: newList,
        showList:_showList
      }, () => {
        this.saveToLocalStorage()
      })
    }
  }
  onAdd() {
    const { fundData, addItem } = this.state
    if (addItem.id) {
      fundData.push(addItem)
    }
    this.setState({
      fundData,
      addItem: {}
    }, () => {
      this.getFundDatas()
      this.saveToLocalStorage()
    })
  }
  changeAddItem(e, type) {
    const { addItem } = this.state 
    addItem[type] = e.target.value
    this.setState({
      addItem
    })
  }
  /**
   * 保存到localStorage
   */
  saveToLocalStorage(data) {
    const { fundData } = this.state
    const json = JSON.stringify(fundData)
    localStorage.setItem('fund',data||json)
  }
  changeDate(e,code,type) {
    let { fundData } = this.state
    const value = fundData.find((item => item.id === code))
    if (type ==='num') {
      value.num = e.target.value
    } else {
      value.money = e.target.value
    }
    this.setState({
      fundData
    })
    const data = JSON.stringify(fundData)
    this.saveToLocalStorage(data)
  }
  /**
   * 导入json
   */
  importJson() {
    const { inputJson } = this.state
    const jsonData = JSON.parse(JSON.parse(inputJson))
    this.setState({
      fundData:jsonData
    }, () => {
      this.getFundDatas()
      this.saveToLocalStorage()
    })
  }
  render() {
    const { showList, fundData,addItem,inputJson } = this.state
    let _today = 0
    let _all = 0
    let _allMoney = 0
    let showList_sort = showList.sort((a,b) => {
      return Number(b.fundcode) - Number(a.fundcode)
    })
    const _showList = showList_sort.map((item) => {
      const isRed = item.dwjz <= item.gsz ? 'red' : 'green'
      const own = fundData.find((item2) => item2.id === item.fundcode) || {num:0,money:0}
      const today = (item.dwjz * own.num * item.gszzl / 100).toFixed(2)
      const all = (item.gsz * own.num - own.money).toFixed(2)
      _today += Number(today)
      _all += Number(all)
      _allMoney += Number(own.money)
      return (
        <tr key={item.fundcode}>
          <td>{item.name}</td>
          <td>{item.fundcode}</td>
          <td>{item.dwjz}</td>
          <td className={isRed}>{item.gsz}</td>
          <td className={isRed}>{item.gszzl}%</td>
          <td><input type="text" placeholder='持仓份额' value={own.num} onChange={(e)=>this.changeDate(e,item.fundcode,'num')}/></td>
          <td><input type="text" placeholder='投入金额' value={own.money} onChange={(e)=>this.changeDate(e,item.fundcode,'money')}/></td>
          <td className={today>0?'red':'green'}>￥{today}</td>
          <td className={all>0?'red':'green'}>￥{all}</td>
          <td>{item.gztime}</td>
          <td onClick={()=>this.ondelete(item.fundcode)}>删除</td>
        </tr>
      )
    })
    return(
      <div className="App">
        <div className='add'>
          <input type="text" placeholder='基金代码' value={addItem.id||''} onChange={e=>this.changeAddItem(e,'id')}/>
          <input type="text" placeholder='持仓份额' value={addItem.num||''} onChange={e=>this.changeAddItem(e,'num')}/>
          <input type="text" placeholder='总投入' value={addItem.money||''} onChange={e=>this.changeAddItem(e,'money')}/>
          <div className='btn blue' onClick={()=>this.onAdd()}>新增</div>
        </div>
        <table border="1">
          <thead>
            <tr>
              <th>基金名称</th>
              <th>基金代码</th>
              <th>单位净值</th>
              <th>今日估值</th>
              <th>今日收益比</th>
              <th>持仓份额</th>
              <th>总投入</th>
              <th>今日收益</th>
              <th>总收益</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {_showList}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={6}></th>
              <th>{_allMoney}</th>
              <th className={_today > 0 ? 'red' : 'green'}>￥{_today.toFixed(2)}</th>
              <th className={_all > 0 ? 'red' : 'green'}>￥{_all.toFixed(2)}</th>
              <th></th>
              <th></th>
            </tr>
          </tfoot>
        </table>
        <div className='Import'>
          <input type="text" placeholder='输入历史数据' value={inputJson} onChange={e => this.setState({inputJson:e.target.value})}/>
          <div className='btn blue' onClick={() => this.importJson()}>导入json</div>
        </div>
        <div id='saveJSON' className='btn' data-clipboard-text={JSON.stringify(localStorage.getItem('fund'))} onClick={()=>alert('复制成功')}>
          保存数据
        </div>
        <div className='btn blue'  onClick={() => this.getFundDatas()}>刷新</div>
      </div>
    );
  }
}


export default App;
