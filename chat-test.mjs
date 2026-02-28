#!/usr/bin/env node
/**
 * Chat interactivo para probar el bot en la terminal.
 * Ejecutar con: node chat-test.mjs
 * (La app NestJS debe estar corriendo en otro terminal)
 */

const BASE_URL = process.env.CHAT_URL ?? 'http://localhost:3000';
const USER_ID = 'terminal-user';

async function sendMessage(text) {
  const res = await fetch(`${BASE_URL}/test/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, waUserId: USER_ID }),
  });
  const data = await res.json();
  return data.response ?? data;
}

async function main() {
  console.log('\n Bot Farmacia - Chat de prueba\n');
  console.log('Escribí como si fuera WhatsApp. Ctrl+C para salir.\n');
  console.log('---\n');

  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => readline.question('Tú: ', async (input) => {
    if (!input?.trim()) {
      prompt();
      return;
    }
    try {
      const response = await sendMessage(input.trim());
      console.log('\nBot:', response.replace(/\n/g, '\n     '));
      console.log('');
    } catch (err) {
      console.log('\nError:', err.message);
      console.log('¿La app está corriendo? (npm run start:dev)\n');
    }
    prompt();
  });

  prompt();
}

main().catch(console.error);
