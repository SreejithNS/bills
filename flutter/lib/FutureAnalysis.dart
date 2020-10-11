import 'package:flutter/material.dart';

class FutureAnalysis extends StatefulWidget {
  @override
  _FutureAnalysisState createState() => _FutureAnalysisState();
}

class _FutureAnalysisState extends State<FutureAnalysis> {
  List<String> _locations = ['maggi', 'colgate', 'lays', 'oreo']; // Option 2
  String _selectedLocation;
  DateTime selectedDate = DateTime.now();
  bool vis = false;

  Future<void> _selectDate(BuildContext context) async {
    final DateTime picked = await showDatePicker(
        context: context,
        initialDate: selectedDate,
        firstDate: DateTime(2015, 8),
        lastDate: DateTime(2101));
    if (picked != null && picked != selectedDate)
      setState(() {
        selectedDate = picked;
      });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
      appBar: AppBar(
        title: Text("Future Analysis"),
      ),
      body: Container(
          child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            height: 15.0,
          ),
          Center(
            child: DropdownButton(
              hint:
                  Text('Please choose a Product'), // Not necessary for Option 1
              value: _selectedLocation,
              onChanged: (newValue) {
                setState(() {
                  _selectedLocation = newValue;
                });
              },
              items: _locations.map((location) {
                return DropdownMenuItem(
                  child: new Text(location),
                  value: location,
                );
              }).toList(),
            ),
          ),
          SizedBox(
            height: 20.0,
          ),
          RaisedButton(
            onPressed: () => _selectDate(context),
            child: Text('Select date'),
          ),
          SizedBox(
            height: 20.0,
          ),
          Text("${selectedDate.toLocal()}".split(' ')[0]),
          SizedBox(
            height: 20.0,
          ),
          RaisedButton(
            onPressed: () {
              setState(() {
                vis = true;
              });
            },
            child: Text('Predict'),
          ),
          SizedBox(
            height: 25.0,
          ),
          if (vis == true)
            Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(" According to prediction on "),
                  Text("${selectedDate.toLocal()} ".split(' ')[0]),
                  Text(", 52 items will be sold"),
                ]),
        ],
      )),
    ));
  }
}
