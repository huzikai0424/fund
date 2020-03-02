import React from 'react';
import './App.css';
class App extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      fundList: ['001740','005939','400015','519674','320007','001645','000522'],
      fundData: JSON.parse(localStorage.getItem('fund')) || [],
      showList: [],
      today: 0,
      all:0
    }
  }
  componentDidMount() {
    this.getFundDatas()
    setInterval(() => {
      this.getFundDatas()
    },2*60*1000)
  }
  getFundDatas() {
    this.setState({
      showList:[]
    })
    this.state.fundList.forEach((item) => {
      this.jsonp(`http://fundgz.1234567.com.cn/js/${item}.js?rt=${new Date().getTime()}`)
    })
  }
  jsonp(url, jsonpCallback = 'jsonpgz') {
    const script = document.createElement('script')
    script.src = url
    script.onload = (e)=> {
      e.currentTarget.remove()
    }
    window[jsonpCallback] = data => {
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
    localStorage.setItem('fund',data)
  }
  render() {
    const { showList, fundData } = this.state
    let _today = 0
    let _all = 0
    let _allMoney = 0
    const _showList = showList.map((item) => {
      const isRed = item.dwjz <= item.gsz ? 'red' : 'green'
      const own = fundData.find((item2) => item2.id === item.fundcode)
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
        </tr>
      )
    })
    return(
      <div className="App">
        <button onClick={() => this.getFundDatas()}>刷新</button>
        <hr/>
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
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
}


export default App;
