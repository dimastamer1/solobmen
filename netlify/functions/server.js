const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('solana-exchange');
    
    // Обработка разных маршрутов
    if (event.path.includes('/auth/login')) {
      // Логика авторизации
    } else if (event.path.includes('/auth/register')) {
      // Логика регистрации
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    await client.close();
  }
};