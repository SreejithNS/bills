import 'dart:convert';
import "package:flutter/material.dart";
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'NetworkHandler.dart';
import 'HomePage.dart';
import 'SignInPage.dart';

class SignUpPage extends StatefulWidget {
  SignUpPage({Key key}) : super(key: key);

  @override
  _SignUpPageState createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  bool vis = true;
  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  TextEditingController _emailController = TextEditingController();
  TextEditingController _passwordController = TextEditingController();
  TextEditingController _phoneController = TextEditingController();
  TextEditingController _firstnameController = TextEditingController();
  TextEditingController _lastnameController = TextEditingController();
  String errorText;
  bool validate = false;
  bool validatename = false;
  bool validatephone = false;
  bool validatepassword = false;
  bool circular = false;
  final storage = new FlutterSecureStorage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        child: Form(
          key: _globalkey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Sign up",
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              SizedBox(
                height: 20,
              ),
              firstnameTextField(),
              lastnameTextField(),
              phoneTextField(),
              emailTextField(),
              passwordTextField(),
              SizedBox(
                height: 10,
              ),
              InkWell(
                onTap: () {
                  Navigator.pushReplacement(context,
                      MaterialPageRoute(builder: (context) => SignInPage()));
                },
                child: Text(
                  "Existing User?",
                  style: TextStyle(
                    color: Colors.blue[900],
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              SizedBox(
                height: 10,
              ),
              InkWell(
                onTap: () async {
                  setState(() {
                    circular = true;
                  });
                  if (_globalkey.currentState.validate()) {
                    // we will send the data to rest server
                    Map<String, String> data = {
                      "firstName": _firstnameController.text,
                      if (_lastnameController.text != "")
                        "lastName": _lastnameController.text,
                      "phone": _phoneController.text,
                      if (_emailController.text != "")
                        "email": _emailController.text,
                      "password": _passwordController.text,
                    };
                    print(data);
                    var responseRegister =
                        await networkHandler.post("/auth/register", data);

                    print(responseRegister.statusCode);

                    Map<String, dynamic> output =
                        json.decode(responseRegister.body);
                    print(output["message"]);
                    print(output["data"]);
                    if (responseRegister.statusCode == 200 ||
                        responseRegister.statusCode == 201) {
                      Map<String, String> data = {
                        "phone": _phoneController.text,
                        "password": _passwordController.text,
                      };
                      var response =
                          await networkHandler.post("/auth/login", data);
                      print(response.statusCode);
                      if (response.statusCode == 200 ||
                          response.statusCode == 201) {
                        Map<String, dynamic> output =
                            json.decode(response.body);
                        print(output["token"]);
                        await storage.write(
                            key: "token", value: output["data"]["token"]);
                        setState(() {
                          circular = false;
                        });
                        Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                              builder: (context) => HomePage(),
                            ),
                            (route) => false);
                      } else {
                        Scaffold.of(context).showSnackBar(
                            SnackBar(content: Text("Netwok Error")));
                      }
                    }

                    setState(() {
                      circular = false;
                    });
                  } else {
                    setState(() {
                      circular = false;
                    });
                  }
                },
                child: circular
                    ? CircularProgressIndicator()
                    : Container(
                        width: 150,
                        height: 50,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: Color(0xff00A86B),
                        ),
                        child: Center(
                          child: Text(
                            "Sign Up",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget firstnameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("First Name"),
          TextFormField(
            validator: (value) {
              if (value.isEmpty) return "First Name can't be empty";
              return null;
            },
            controller: _firstnameController,
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget lastnameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Last Name"),
          TextFormField(
            controller: _lastnameController,
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget phoneTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Phone Number"),
          TextFormField(
            inputFormatters: [WhitelistingTextInputFormatter.digitsOnly],
            controller: _phoneController,
            validator: (value) {
              if (value.isEmpty) return "Phone number can't be empty";
              if (value.length != 10) return "Phone number is invalid";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget emailTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Email"),
          TextFormField(
            controller: _emailController,
            validator: (value) {
              if (!value.isEmpty) if (!value.contains("@"))
                return "Email is Invalid";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget passwordTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Password"),
          TextFormField(
            controller: _passwordController,
            validator: (value) {
              if (value.isEmpty) return "Password can't be empty";
              if (value.length < 8) return "Password lenght must have >=8";
              return null;
            },
            obscureText: vis,
            decoration: InputDecoration(
              suffixIcon: IconButton(
                icon: Icon(vis ? Icons.visibility_off : Icons.visibility),
                onPressed: () {
                  setState(() {
                    vis = !vis;
                  });
                },
              ),
              helperStyle: TextStyle(
                fontSize: 14,
              ),
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
