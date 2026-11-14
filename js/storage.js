(function (root) {
  "use strict";

  var Lessons = (root.Lessons = root.Lessons || {});
  var ADMINS_KEY = "lessons:admins";
  var SESSION_KEY = "lessons:session";
  var ADVENTURERS_KEY = "lessons:adventurers";
  var GROUPS_KEY = "lessons:groups";
  var TASKS_KEY = "lessons:tasks";
  var REWARDS_KEY = "lessons:rewards";
  var memory = {};

  function readList(key) {
    try {
      var data = JSON.parse(root.localStorage.getItem(key));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return (memory[key] || []).slice();
    }
  }

  function writeList(key, list) {
    memory[key] = list.slice();
    try {
      root.localStorage.setItem(key, JSON.stringify(list));
    } catch (error) {
      console.error("LocalStorage unavailable, data kept in memory only.", error);
    }
  }

  function randomInt(maxExclusive) {
    var limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    var buffer = new Uint32Array(1);
    do {
      root.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % maxExclusive;
  }

  function generateId() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") {
      return root.crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    root.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.prototype.map
      .call(bytes, function (b) {
        return ("0" + b.toString(16)).slice(-2);
      })
      .join("");
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
  }

  function isWeakPassword(value) {
    var digits = value.split("").map(Number);
    var same = digits.every(function (d) {
      return d === digits[0];
    });
    var up = digits.every(function (d, i) {
      return i === 0 || d === digits[i - 1] + 1;
    });
    var down = digits.every(function (d, i) {
      return i === 0 || d === digits[i - 1] - 1;
    });
    return same || up || down;
  }

  function generatePassword(length) {
    var size = Math.min(length || 6, 6);
    var password;
    do {
      password = "";
      for (var i = 0; i < size; i += 1) {
        password += String(randomInt(10));
      }
    } while (isWeakPassword(password));
    return password;
  }

  function slug(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function generateUsername(firstName, lastName, isTaken) {
    var base = slug(firstName) + "." + slug(lastName);
    if (!isTaken(base)) return base;

    var candidate;
    var attempts = 0;
    do {
      candidate = base + String(10 + randomInt(90)); 
      attempts += 1;
    } while (isTaken(candidate) && attempts < 200);

    while (isTaken(candidate)) {
      candidate = base + String(100 + randomInt(900)); 
    }
    return candidate;
  }

  var sessionMemory = null;

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function findAdminByEmail(email) {
    var wanted = normalizeEmail(email);
    return (
      readList(ADMINS_KEY).find(function (admin) {
        return admin.email === wanted;
      }) || null
    );
  }

  function createAdmin(data) {
    if (findAdminByEmail(data.email)) return null; 
    var admins = readList(ADMINS_KEY);
    var admin = {
      id: generateId(),
      name: data.name.trim(),
      email: normalizeEmail(data.email),
      password: data.password,
      category: data.category,
      createdAt: new Date().toISOString()
    };
    admins.push(admin);
    writeList(ADMINS_KEY, admins);
    return admin;
  }

  function authenticate(email, password) {
    var admin = findAdminByEmail(email);
    return admin && admin.password === password ? admin : null;
  }

  function readSession() {
    try {
      return root.localStorage.getItem(SESSION_KEY);
    } catch (error) {
      return sessionMemory;
    }
  }

  function writeSession(id) {
    sessionMemory = id;
    try {
      if (id) root.localStorage.setItem(SESSION_KEY, id);
      else root.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("LocalStorage unavailable, session kept in memory only.", error);
    }
  }

  function currentAdmin() {
    var id = readSession();
    if (!id) return null;
    return (
      readList(ADMINS_KEY).find(function (admin) {
        return admin.id === id;
      }) || null
    );
  }

  Lessons.admins = {
    create: createAdmin,
    emailExists: function (email) {
      return !!findAdminByEmail(email);
    },
    authenticate: authenticate
  };
  Lessons.session = {
    current: currentAdmin,
    start: function (admin) {
      writeSession(admin.id);
    },
    end: function () {
      writeSession(null);
    }
  };

  function withDefaults(user) {
    if (typeof user.coins !== "number") user.coins = 0;
    return user;
  }

  function readAll() {
    return readList(ADVENTURERS_KEY).map(withDefaults);
  }

  function readMine() {
    var admin = currentAdmin();
    return readAll().filter(function (user) {
      return !!admin && user.adminId === admin.id;
    });
  }

  function fullName(user) {
    return user.firstName + " " + user.lastName;
  }

  function allAdventurers() {
    return readMine().sort(function (a, b) {
      return fullName(a).localeCompare(fullName(b), "pt-BR", { sensitivity: "base" }) || a.username.localeCompare(b.username);
    });
  }

  function create(data) {
    var admin = currentAdmin();
    if (!admin) return null;
    var users = readAll();
    var taken = function (name) {
      return users.some(function (user) {
        return user.adminId === admin.id && user.username === name;
      });
    };
    var user = {
      id: generateId(),
      firstName: data.firstName,
      lastName: data.lastName,
      height: data.height,
      weight: data.weight,
      guardianPhone: data.guardianPhone,
      document: data.document,
      bloodType: data.bloodType,
      coins: 0, // every new adventurer starts with 0 coins
      username: generateUsername(data.firstName, data.lastName, taken),
      password: generatePassword(6),
      adminId: admin.id,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeList(ADVENTURERS_KEY, users);
    return user;
  }

  function update(id, data) {
    var admin = currentAdmin();
    var users = readAll();
    var user = users.find(function (item) {
      return item.id === id && !!admin && item.adminId === admin.id;
    });

    if (!user) return null;

    var nameChanged =
      slug(user.firstName) + "." + slug(user.lastName) !== slug(data.firstName) + "." + slug(data.lastName);
    ["firstName", "lastName", "height", "weight", "guardianPhone", "document", "bloodType"].forEach(function (key) {
      user[key] = data[key];
    });

    if (nameChanged) {
      user.username = generateUsername(user.firstName, user.lastName, function (name) {
        return users.some(function (other) {
        return other.id !== id && other.adminId === admin.id && other.username === name;
        });
      });
    }

    user.updatedAt = new Date().toISOString();
    writeList(ADVENTURERS_KEY, users);
    return user;
  }

  function remove(id) {
    var admin = currentAdmin();
    if (!admin) return;
    writeList(
      ADVENTURERS_KEY,
      readAll().filter(function (user) {
        return !(user.id === id && user.adminId === admin.id);
      })
    );
    var groups = readList(GROUPS_KEY);
    var changed = false;
    groups.forEach(function (group) {
      if (group.adminId !== admin.id || (group.memberIds || []).indexOf(id) === -1) return;
      group.memberIds = group.memberIds.filter(function (memberId) {
        return memberId !== id;
      });
      group.membersCount = group.memberIds.length;
      changed = true;
    });
    if (changed) writeList(GROUPS_KEY, groups);
  }

  Lessons.adventurers = {
    all: allAdventurers,
    fullName: fullName,
    create: create,
    update: update,
    remove: remove,
    findById: function (id) {
      return (
        readMine().find(function (user) {
          return user.id === id;
        }) || null
      );
    }
  };

  function readMyGroups() {
    var admin = currentAdmin();
    return readList(GROUPS_KEY)
      .filter(function (group) {
        return !!admin && group.adminId === admin.id;
      })
      .map(function (group) {
        if (typeof group.membersCount !== "number") group.membersCount = (group.memberIds || []).length;
        return group;
      });
  }

  function cleanName(name) {
    return String(name || "").replace(/\s+/g, " ").trim();
  }

  function groupKey(name) {
    return cleanName(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function groupNameExists(name, exceptId) {
    var key = groupKey(name);
    return readMyGroups().some(function (group) {
      return group.id !== exceptId && groupKey(group.name) === key;
    });
  }

  function myAdventurerIds(ids) {
    var mine = readMine().map(function (user) {
      return user.id;
    });
    return (ids || []).filter(function (id, index, all) {
      return mine.indexOf(id) !== -1 && all.indexOf(id) === index;
    });
  }

  function createGroup(data) {
    var admin = currentAdmin();
    if (!admin || groupNameExists(data.name)) return null;
    var memberIds = myAdventurerIds(data.memberIds);
    var group = {
      id: generateId(),
      name: cleanName(data.name),
      memberIds: memberIds,
      membersCount: memberIds.length,
      adminId: admin.id,
      createdAt: new Date().toISOString()
    };
    var groups = readList(GROUPS_KEY);
    groups.push(group);
    writeList(GROUPS_KEY, groups);
    return group;
  }

  function findGroup(id) {
    return (
      readMyGroups().find(function (group) {
        return group.id === id;
      }) || null
    );
  }

  function updateGroup(id, data) {
    var admin = currentAdmin();
    if (!admin || groupNameExists(data.name, id)) return null;
    var groups = readList(GROUPS_KEY);
    var group = groups.find(function (item) {
      return item.id === id && item.adminId === admin.id;
    });
    if (!group) return null;
    group.name = cleanName(data.name);
    group.memberIds = myAdventurerIds(data.memberIds);
    group.membersCount = group.memberIds.length;
    group.updatedAt = new Date().toISOString();
    writeList(GROUPS_KEY, groups);
    return group;
  }

  function removeGroup(id) {
    var admin = currentAdmin();
    if (!admin) return;
    writeList(
      GROUPS_KEY,
      readList(GROUPS_KEY).filter(function (group) {
        return !(group.id === id && group.adminId === admin.id);
      })
    );
    removeTasksOfGroup(id, admin.id); 
    removeRewardsOfGroup(id, admin.id); 
  }

  Lessons.groups = {
    all: readMyGroups,
    create: createGroup,
    update: updateGroup,
    findById: findGroup,
    remove: removeGroup,
    nameExists: groupNameExists
  };

  function readGroupTasks(groupId) {
    var admin = currentAdmin();
    if (!admin || !findGroup(groupId)) return [];
    return readList(TASKS_KEY).filter(function (task) {
      return task.adminId === admin.id && task.groupId === groupId;
    });
  }

  function taskNameExists(groupId, name, exceptId) {
    var key = groupKey(name);
    return readGroupTasks(groupId).some(function (task) {
      return task.id !== exceptId && groupKey(task.name) === key;
    });
  }

  function findTask(groupId, id) {
    return (
      readGroupTasks(groupId).find(function (task) {
        return task.id === id;
      }) || null
    );
  }

  function clampCoins(value) {
    return Math.min(999, Math.max(1, parseInt(value, 10) || 1));
  }

  function createTask(groupId, data) {
    var admin = currentAdmin();
    if (!admin || !findGroup(groupId) || taskNameExists(groupId, data.name)) return null;
    var task = {
      id: generateId(),
      name: cleanName(data.name),
      coins: clampCoins(data.coins),
      completed: false,
      groupId: groupId,
      adminId: admin.id,
      createdAt: new Date().toISOString()
    };
    var tasks = readList(TASKS_KEY);
    tasks.push(task);
    writeList(TASKS_KEY, tasks);
    return task;
  }

  function adjustAdventurerCoins(ids, delta) {
    var admin = currentAdmin();
    if (!admin || !ids || !ids.length || !delta) return;
    var users = readAll();
    users.forEach(function (user) {
      if (user.adminId === admin.id && ids.indexOf(user.id) !== -1) {
        user.coins = Math.max(0, user.coins + delta);
      }
    });
    writeList(ADVENTURERS_KEY, users);
  }

  function changeTask(id, fn) {
    var admin = currentAdmin();
    if (!admin) return null;
    var tasks = readList(TASKS_KEY);
    var task = tasks.find(function (item) {
      return item.id === id && item.adminId === admin.id;
    });
    if (!task || !findGroup(task.groupId) || fn(task) === false) return null;
    task.updatedAt = new Date().toISOString();
    writeList(TASKS_KEY, tasks);
    return task;
  }

  function updateTask(id, data) {
    return changeTask(id, function (task) {
      if (taskNameExists(task.groupId, data.name, id)) return false;
      var coins = clampCoins(data.coins);
      task.name = cleanName(data.name);
      if (task.completed && task.paidTo && task.paidTo.length) {
        adjustAdventurerCoins(task.paidTo, coins - task.paidCoins);
        task.paidCoins = coins;
      }
      task.coins = coins;
    });
  }

  function setTaskCompleted(id, completed) {
    completed = !!completed;
    return changeTask(id, function (task) {
      if (completed === !!task.completed) return false; 
      if (completed) {
        var members = myAdventurerIds(findGroup(task.groupId).memberIds);
        adjustAdventurerCoins(members, task.coins);
        task.paidTo = members;
        task.paidCoins = task.coins;
      } else {
        adjustAdventurerCoins(task.paidTo || [], -(task.paidCoins || 0));
        task.paidTo = [];
        task.paidCoins = 0;
      }
      task.completed = completed;
    });
  }

  function removeTask(id) {
    var admin = currentAdmin();
    if (!admin) return;
    writeList(
      TASKS_KEY,
      readList(TASKS_KEY).filter(function (task) {
        return !(task.id === id && task.adminId === admin.id);
      })
    );
  }

  function removeTasksOfGroup(groupId, adminId) {
    writeList(
      TASKS_KEY,
      readList(TASKS_KEY).filter(function (task) {
        return !(task.groupId === groupId && task.adminId === adminId);
      })
    );
  }

  Lessons.tasks = {
    all: readGroupTasks,
    findById: findTask,
    create: createTask,
    update: updateTask,
    setCompleted: setTaskCompleted,
    remove: removeTask,
    nameExists: taskNameExists
  };

  function readGroupRewards(groupId) {
    var admin = currentAdmin();
    if (!admin || !findGroup(groupId)) return [];
    return readList(REWARDS_KEY)
      .filter(function (reward) {
        return reward.adminId === admin.id && reward.groupId === groupId;
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) || a.createdAt.localeCompare(b.createdAt);
      });
  }

  function rewardNameExists(groupId, name, exceptId) {
    var key = groupKey(name);
    return readGroupRewards(groupId).some(function (reward) {
      return reward.id !== exceptId && groupKey(reward.name) === key;
    });
  }

  function findReward(groupId, id) {
    return (
      readGroupRewards(groupId).find(function (reward) {
        return reward.id === id;
      }) || null
    );
  }

  function createReward(groupId, data) {
    var admin = currentAdmin();
    if (!admin || !findGroup(groupId) || rewardNameExists(groupId, data.name)) return null;
    var reward = {
      id: generateId(),
      name: cleanName(data.name),
      coins: clampCoins(data.coins),
      redeemedCount: 0, // how many times it was redeemed
      groupId: groupId,
      adminId: admin.id,
      createdAt: new Date().toISOString()
    };
    var rewards = readList(REWARDS_KEY);
    rewards.push(reward);
    writeList(REWARDS_KEY, rewards);
    return reward;
  }

  function changeReward(id, change) {
    var admin = currentAdmin();
    if (!admin) return null;
    var rewards = readList(REWARDS_KEY);
    var reward = rewards.find(function (item) {
      return item.id === id && item.adminId === admin.id;
    });
    if (!reward || !findGroup(reward.groupId) || change(reward) === false) return null;
    reward.updatedAt = new Date().toISOString();
    writeList(REWARDS_KEY, rewards);
    return reward;
  }

  function updateReward(id, data) {
    return changeReward(id, function (reward) {
      if (rewardNameExists(reward.groupId, data.name, id)) return false;
      reward.name = cleanName(data.name);
      reward.coins = clampCoins(data.coins);
    });
  }

  function removeReward(id) {
    var admin = currentAdmin();
    if (!admin) return;
    writeList(
      REWARDS_KEY,
      readList(REWARDS_KEY).filter(function (reward) {
        return !(reward.id === id && reward.adminId === admin.id);
      })
    );
  }

  function removeRewardsOfGroup(groupId, adminId) {
    writeList(
      REWARDS_KEY,
      readList(REWARDS_KEY).filter(function (reward) {
        return !(reward.groupId === groupId && reward.adminId === adminId);
      })
    );
  }

  function redeemReward(groupId, rewardId, adventurerIds) {
    var admin = currentAdmin();
    var reward = findReward(groupId, rewardId);
    if (!admin || !reward) return null;
    var memberIds = findGroup(groupId).memberIds || []; 
    var buyers = readAll().filter(function (user) {
      return user.adminId === admin.id && memberIds.indexOf(user.id) !== -1 && adventurerIds.indexOf(user.id) !== -1;
    });
    if (!buyers.length) return null;

    var short = buyers.filter(function (user) {
      return user.coins < reward.coins;
    });
    if (short.length) return { redeemed: false, short: short };

    adjustAdventurerCoins(
      buyers.map(function (user) {
        return user.id;
      }),
      -reward.coins
    );
    changeReward(rewardId, function (item) {
      item.redeemedCount = (item.redeemedCount || 0) + 1;
    });
    return { redeemed: true, short: [] };
  }

  Lessons.rewards = {
    all: readGroupRewards,
    findById: findReward,
    create: createReward,
    update: updateReward,
    remove: removeReward,
    nameExists: rewardNameExists,
    redeem: redeemReward
  };
})(window);
