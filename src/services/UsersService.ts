type User = { id: string; name: string; email: string };

const users: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

export default class UsersService {
  static getAllUsers(): User[] {
    return users;
  }

  static getUserById(id: string): User | undefined {
    return users.find((u) => u.id === id);
  }
}
