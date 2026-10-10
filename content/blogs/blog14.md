---
title: "Building a 16-bit VM from Scratch"
slug: "building-16bit-vm-from-scratch"
aliases:
  - /blogs/blog14/
  - /blogs/blog14/index.html
date: 2025-08-10
tags: ["Systems", "C", "Virtual Machine", "LC-3", "Low Level"]
description: "Cutting through the layers of modern abstraction by building a Little Computer 3 (LC-3) Virtual Machine."
summary: "How and why I built a 16-bit virtual machine. Emulating memory, registers, and opcodes to understand what actually happens under the hood."
ShowPostNavLinks: true
weight: 86
type: post
image: "/images/blogs/lc3-vm.jpg"
showTableOfContents: true
draft: false

---

## Introduction

Modern development is buried under layers of abstraction. You write JavaScript, which runs on V8, which is written in C++, which compiles to assembly, which the OS schedules on the CPU microcode.

Most developers have no idea what happens when they declare a variable. 

Now comes the real part:
**Stripping away all the bloated layers and building a computer inside your computer.**

This blog covers my `vm-lc3` project. The LC-3 (Little Computer 3) is a simplified, educational assembly language. Instead of writing code *for* it, I wrote the machine that *executes* it. 

You can check out the full source code on my GitHub: 
[https://github.com/shivjeet1/vm-lc3.git](https://github.com/shivjeet1/vm-lc3.git)

![LC-3 Virtual Machine Execution](/images/blogs/lc3-vm.jpg "LC-3 Virtual Machine Execution")

---

## What This Project Actually Is

A Virtual Machine in this context is not VMware or VirtualBox. It is a software emulation of a physical CPU. 

To build it, you only need to simulate three things:
1. **Memory:** An array of 65,536 16-bit integers.
2. **Registers:** 10 small storage slots for the CPU to do quick math.
3. **The Fetch-Decode-Execute Cycle:** An infinite loop that reads an instruction, figures out what it means, and does it.

Minimal, raw, and completely under your control.

---

## Step 1: Defining the Hardware in Software

You do not need a massive framework to build a CPU. You just need arrays and enums.

First, we define the memory limit. The LC-3 has 65,536 memory locations (since it is 16-bit, `2^16`).

```c
// 65536 locations
uint16_t memory[UINT16_MAX];
```

Next, we define the registers. The LC-3 has 8 general-purpose registers (R0-R7), a Program Counter (PC), and a Condition Flag (COND).

```c
enum {
    R_R0 = 0,
    R_R1,
    R_R2,
    R_R3,
    R_R4,
    R_R5,
    R_R6,
    R_R7,
    R_PC, /* program counter */
    R_COND,
    R_COUNT
};

uint16_t reg[R_COUNT];
```

---

## Step 2: The Instruction Set

The CPU only understands 16 commands (Opcodes). That is it.
Things like `ADD`, `AND`, `JUMP`, `LOAD`, and `STORE`.

We define them simply:

```c
enum {
    OP_BR = 0, /* branch */
    OP_ADD,    /* add  */
    OP_LD,     /* load */
    OP_ST,     /* store */
    // ... other opcodes
    OP_TRAP    /* execute system call */
};
```

---

## Step 3: The Execution Loop (The Heart of the Machine)

Every processor on the planet, from an ancient GameBoy to an M3 Max, fundamentally does this exact same loop.

1. **Fetch:** Read the instruction at the memory address in the Program Counter.
2. **Increment:** Move the Program Counter to the next instruction.
3. **Decode:** Look at the first 4 bits to figure out which opcode it is.
4. **Execute:** Run the corresponding logic.

Here is what the core of the VM looks like:

```c
int running = 1;
while (running) {
    // 1. Fetch
    uint16_t instr = mem_read(reg[R_PC]++);
    
    // 2. Decode (Shift right 12 bits to get the 4-bit opcode)
    uint16_t op = instr >> 12;

    // 3. Execute
    switch (op) {
        case OP_ADD:
            // Extract registers and add them
            break;
        case OP_AND:
            // Extract registers and bitwise AND them
            break;
        case OP_JMP:
            // Change the PC to a new address
            break;
        // ... handle other opcodes
        default:
            // Bad instruction
            break;
    }
}
```

---

## Step 4: Running Real Programs

Because this is a fully compliant LC-3 emulator, it can run actual compiled LC-3 assembly programs.

You can load a `.obj` file into the memory array, set the Program Counter to the start address (usually `0x3000`), and watch your C program play a fully functioning game of 2048 or Rogue in the terminal.

---

## Common Issues During Build

* **Endianness:** Modern x86 CPUs are little-endian. LC-3 is big-endian. You have to write a bit-swapping function to load the programs into memory correctly or it will read the instructions backward and crash.
* **Terminal I/O:** Handling keyboard input for the VM requires disabling standard terminal buffering (canonical mode) so the VM can read keystrokes instantly without waiting for the user to press Enter.

---

## Conclusion

Building a VM demystifies computing. Once you write the code that executes an `ADD` instruction, you never look at high-level languages the same way again.

There is no magic. It is all just moving bits between arrays.

---

## Personal Opinion

> I got tired of not knowing what happens at the bottom of the stack.
> This project exists so I can prove to myself that a computer is just a very fast, very stupid calculator following basic rules.
> Writing a 100-line React component is fine for work, but writing a `switch` statement that acts as a CPU is actual engineering.

---




