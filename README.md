# Чат с GigaChat

## Техническая документация

Клиент: React, TypeScript, Ant Design, axios  
Сервер: fastapi, pydantic, requests, uvicorn  

## Пояснительная записка  

Проект реализует веб-приложение для общения с языковой моделью.  
Приложение позволяет пользователю вводить запросы, отправлять их на сервер, получать ответы от модели (GigaChat) и отображать диалог в реальном времени.  

## Технологии для обработки запросов и ответов:  

### Клиент:  
Axios, удобная и широко распространенная библиотека для выполнения HTTP-запросов, поддерживает асинхронную обработку запросов  

### Сервер:  
FastAPI, современный фреймворк для создания REST API, обладает высокой производительностью, поддерживает асинхронность, а также автоматическую валидацию данных с помощью Pydantic.  

## Frontend  

При первом заходе на страницу мы генерируем ID сессии, это позволяет GigaChat быстрее обрабатывать историю чата и учитывать контекст диалога, храним в localStorage ID сессии и историю чата, чтобы при обновлении страницы, сообщения в чате не пропадали и GigaChat помнил диалог.  

Для обновления истории чата есть кнопка, которая чистит localStorage, после ее нажатия сообщения в чате пропадают и начинается новый диалог  

### Компонент ChatWindow:  
- Отображает поле ввода запроса и область вывода ответа  
- Используются хуки useState, useRef, useEffect  

### Компонент ChatMessage:  
Используется для отображения каждого сообщения в чате  

## Backend  

При поступлении запроса сначала выполняется POST-запрос к API GigaChat.  
Передается ключ авторизации для получения токена доступа, который используется для последующих запросов.  
Если токен истекает, осуществляется запрос на получение нового токена.  

### `POST /chat`  

Эндпоинт для отправки POST запроса.  
Принимает в теле запроса историю сообщений, включая крайнее сообщение пользователя, также параметры для настройки работы языковой модели.  

В заголовках передаются токен доступа, ID сессии и дополнительная информация.  
