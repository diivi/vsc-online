//helper functions
//find object with a particular attr inside an array of objects
function findWithAttr(array, attr, value) {
  for (var i = 0; i < array.length; i += 1) {
    if (array[i][attr] === value) {
      return i;
    }
  }
  return -1;
}
//check if mem address is free
function checkAddressAvailability(address) {
  if (!address) {
    return false;
  }
  if (!(address >= 0 && address <= 999)) {
    return false;
  }
  if (address in env.addresses) {
    return false;
  }
  return true;
}
//check if given mem address is valid
function checkAddressValidity(address) {
  if (!address) {
    return false;
  }
  if (!(address >= 0 && address <= 999)) {
    return false;
  }
  if (!(address in env.addresses)) {
    return false;
  }
  return true;
}
//check if line address to jump to is valid
function checkAddValidity(address) {
  for (var i = 0; i < allCommands.length; i++) {
    if (allCommands[i].add == address) {
      return true;
    }
  }
  return false;
}
//handling maximum call stack size exceeded error (infinite loop)
window.onerror = function (error, url, line) {
  console.log(error);
};
//instructon codes
insCodes = {
  0: "halt",
  1: "strt",
  2: "lodm",
  3: "lodn",
  4: "lods",
  5: "stor",
  6: "add",
  7: "neg",
  8: "jmp",
  9: "jmp-",
  10: "jmp0",
  11: "jpm+",
  12: "inpn",
  13: "inps",
  14: "out",
  15: "outl",
};
//enviroment class that stores the accumulator, output, all comamnds and addresses.
function Environment() {
  this.acc = NaN;
  this.running = true;
  this.output = "";
  this.commands = [];
  this.addresses = {};
}
//check if the list of commands is valid (in order etc.)
function validityCheck(allCommands) {
  //check first address and initialise it
  if (!isNaN(allCommands[0].add)) {
    currAddress = allCommands[0].add;
  } else {
    return "Error: Addresses must be integers";
  }
  //check start
  if (allCommands[0].insCode != 1) {
    return `Error:  Please start the program with Instrn code 1.`;
  }
  //check if halt exists
  if (allCommands[allCommands.length - 1].insCode != 0) {
    return `Error: Please End the program with Instrn code 0 to halt it.`;
  }
  //check that all addresses are integers
  for (let i = 0; i <= allCommands.length - 1; i++) {
    if (isNaN(allCommands[i].add)) {
      return `Error: All Adresses should be integers for the PC to function normally, check address at line ${
        i + 1
      }`;
    }
  }
  //check that all instrn codes are valid
  for (let i = 0; i <= allCommands.length - 1; i++) {
    if (
      !(!isNaN(allCommands[i].insCode) && allCommands[i].insCode in insCodes)
    ) {
      return `Error: Invalid Instruction Code at line ${i + 1}`;
    }
  }
  //check consecutive addresses
  for (let i = 1; i <= allCommands.length - 1; i++) {
    // console.log(currAddress, allCommands[i].add);
    if (parseInt(allCommands[i].add) !== parseInt(currAddress) + 1) {
      return `Error: Adresses should be consecutive for the PC to function normally, check address at line ${
        i + 1
      }`;
    } else {
      currAddress = parseInt(currAddress) + 1;
    }
  }
}
// vsc command object
function Command() {
  this.add = arguments[0][0];
  this.insCode = arguments[0][1];
  if (typeof arguments[0][2] !== "undefined") {
    if (!arguments[0][2].startsWith("#")) {
      this.optOperand = arguments[0][2];
    }
  }
}

$(document).ready(function () {
  $("#exec").click(function (e) {
    e.preventDefault();
    const code = editor.getValue();
    commands = code.split("\n");
    allCommands = splitCommands(commands);
    var out = processCommands(allCommands);
    if (out.startsWith("Error:")) {
      $("#output").css("color", "red");
    }
    $("#output").val(out);
  });
});
//split commands at \n
function splitCommands(commands) {
  allCommands = [];
  commands.forEach((command) => {
    vscCommand = new Command(command.match(/(?:[^\s"]+|"[^"]*")+/g));
    allCommands.push(vscCommand);
  });
  return allCommands;
}
//check command validity and then exec them to recieve output
function processCommands(allCommands) {
  error = validityCheck(allCommands);
  if (error) {
    return error;
  }
  env = new Environment();
  env.commands = allCommands;
  return execCommands(allCommands);
}

function execCommands(allCommands) {
  for (let i = 0; i <= allCommands.length - 1; i++) {
    command = allCommands[i];
    if (env.running) {
      if (command.insCode == 0) {
        //end
        env.running = false;
        return env.output;
      } else if (command.insCode == 2) {
        //load acc with data from mem address
        if (!checkAddressValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } is either invalid or does not exist.  line : ${allCommands.indexOf(
            command
          )}`;
        } else {
          env.acc = env.addresses[command.optOperand];
        }
      } else if (command.insCode == 3) {
        //load acc with number
        if (!isNaN(command.optOperand)) {
          env.acc = parseInt(command.optOperand);
        } else {
          env.output = `Error: Please enter a valid number for the accumulator to be loaded with. line : ${
            allCommands.indexOf(command) + 1
          }`;
        }
      } else if (command.insCode == 4) {
        //load acc with string
        wqString = `${command.optOperand.replace(/['"]+/g, "")}`;
        env.acc = wqString;
      } else if (command.insCode == 5) {
        //store acc at address
        if (env.acc === undefined) {
          env.output = `Error: Accumulator uninitialised but used at line ${
            allCommands.indexOf(command) + 1
          }`;
        }

        if (!checkAddressAvailability(command.optOperand)) {
          if (command.optOperand in env.addresses) {
            env.addresses[command.optOperand] = env.acc;
          } else {
            env.output = `Error: Address ${
              command.optOperand
            } is either invalid or does not exist.  line : ${
              allCommands.indexOf(command) + 1
            }`;
          }
        } else {
          env.addresses[command.optOperand] = env.acc;
        }
      } else if (command.insCode == 6) {
        // add to acc by address
        if (env.acc === undefined) {
          env.output = `Error: Accumulator uninitialised but used at line ${
            allCommands.indexOf(command) + 1
          }`;
        }
        if (!checkAddressValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } is either invalid or does not exist.  line : ${
            allCommands.indexOf(command) + 1
          }`;
        } else {
          env.acc += env.addresses[command.optOperand];
        }
      } else if (command.insCode == 7) {
        //neg acc
        env.acc = env.acc * -1;
      } else if (command.insCode == 8) {
        //jmp to address after checking its validity
        if (!checkAddValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } can't be jumped to as it is either invalid or does not exist.  line : ${
            allCommands.indexOf(command) + 1
          }`;
          break;
        } else {
          let jmpIndex = findWithAttr(env.commands, "add", command.optOperand);
          try {
            execCommands(env.commands.slice(jmpIndex, env.commands.length));
          } catch (e) {
            if (e.message.endsWith("exceeded")) {
              env.output = `Error: Maximum Call Stack Size Exceeded.`;

              env.running = false;
              break;
            } else {
              env.output = `Error: Could not interpret code`;
            }
          }
        }
      } else if (command.insCode == 9) {
        //jmp to a if acc is negative
        if (!checkAddValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } can't be jumped to as it is either invalid or does not exist.  line : ${
            allCommands.indexOf(command) + 1
          }`;
          env.running = false;
          break;
        } else {
          if (env.acc < 0) {
            let jmpIndex = findWithAttr(
              env.commands,
              "add",
              command.optOperand
            );
            try {
              execCommands(env.commands.slice(jmpIndex, env.commands.length));
            } catch (e) {
              if (e.message.endsWith("exceeded")) {
                env.output = `Error: Maximum Call Stack Size Exceeded.`;

                env.running = false;
                break;
              } else {
                env.output = `Error: Could not interpret code`;
              }
            }
          } else {
            continue;
          }
        }
      } else if (command.insCode == 10) {
        //jmp to a if acc is 0
        if (!checkAddValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } can't be jumped to as it is either invalid or does not exist.  line : ${
            allCommands.indexOf(command) + 1
          }`;
          env.running = false;
          break;
        } else {
          if (env.acc == 0) {
            let jmpIndex = findWithAttr(
              env.commands,
              "add",
              command.optOperand
            );
            try {
              execCommands(env.commands.slice(jmpIndex, env.commands.length));
            } catch (e) {
              if (e.message.endsWith("exceeded")) {
                env.output = `Error: Maximum Call Stack Size Exceeded.`;

                env.running = false;
                break;
              } else {
                env.output = `Error: Could not interpret code`;
              }
            }
          } else {
            continue;
          }
        }
      } else if (command.insCode == 11) {
        //jmp to a if acc is positive
        if (!checkAddValidity(command.optOperand)) {
          env.output = `Error: Address ${
            command.optOperand
          } can't be jumped to as it is either invalid or does not exist.  line : ${
            allCommands.indexOf(command) + 1
          }`;
          break;
        } else {
          if (env.acc > 0) {
            let jmpIndex = findWithAttr(
              env.commands,
              "add",
              command.optOperand
            );
            try {
              execCommands(env.commands.slice(jmpIndex, env.commands.length));
            } catch (e) {
              if (e.message.endsWith("exceeded")) {
                env.output = `Error: Maximum Call Stack Size Exceeded.`;
                env.running = false;
                break;
              } else {
                env.output = `Error: Could not interpret code`;
              }
            }
          } else {
            continue;
          }
        }
      } else if (command.insCode == 12) {
        do {
          env.acc = parseInt(
            prompt(`Number Input for line ${allCommands.indexOf(command) + 1} `)
          );
        } while (isNaN(env.acc));
      } else if (command.insCode == 13) {
        env.acc = prompt(
          `String Input for line ${allCommands.indexOf(command) + 1} `
        );
      } else if (command.insCode == 14) {
        //acc out
        env.output += `${env.acc}`;
      } else if (command.insCode == 15) {
        env.output += "\n";
      }
    } else {
      break;
    }
  }
  return env.output;
}
