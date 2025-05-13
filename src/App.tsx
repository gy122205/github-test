import { useState, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import routes from './router/index'
import { useRoutes } from 'react-router-dom'
import CommentList from './components/CommentList'

function App() {
  const element = useRoutes(routes)
  return (
    <div className="App">
      <h1>商品评论列表</h1>
      <CommentList />
      <Suspense fallback={<div>loading...</div>}>{element}</Suspense>
    </div>
  )
}

export default App
